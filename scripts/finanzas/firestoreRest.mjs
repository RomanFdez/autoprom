// Escribe en Firestore vía API REST usando la credencial del owner ya logada
// en el CLI de Firebase (~/.config/configstore/firebase-tools.json).
// Probado: write+delete devuelven HTTP 200 en el proyecto autoprom-84fe0.
import fs from 'fs';
import os from 'os';
import https from 'https';

const PROJECT = 'autoprom-84fe0';
// client_id/secret públicos del CLI de Firebase (no son secretos del usuario).
const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const data = body == null ? null : (typeof body === 'string' ? body : JSON.stringify(body));
    const req = https.request(options, (res) => {
      let buf = '';
      res.on('data', (d) => (buf += d));
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

export async function getAccessToken() {
  const cfgPath = os.homedir() + '/.config/configstore/firebase-tools.json';
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const refresh = cfg.tokens && cfg.tokens.refresh_token;
  if (!refresh) throw new Error('No refresh_token en firebase-tools.json. Ejecuta: npx firebase login');
  const form = `client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&client_secret=${encodeURIComponent(CLIENT_SECRET)}` +
    `&refresh_token=${encodeURIComponent(refresh)}&grant_type=refresh_token`;
  const r = await httpsRequest({
    host: 'oauth2.googleapis.com', path: '/token', method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(form) },
  }, form);
  if (r.status !== 200) throw new Error('Fallo al obtener access_token: ' + r.body);
  return JSON.parse(r.body).access_token;
}

// Convierte un objeto plano a "fields" tipados de Firestore.
function toFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) fields[k] = { nullValue: null };
    else if (typeof v === 'number') fields[k] = { doubleValue: v };
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    else fields[k] = { stringValue: String(v) };
  }
  return fields;
}

// docsById: { [docId]: planObject }. Escribe en lotes de 450 con :commit.
export async function commitDocs(collection, docsById) {
  const token = await getAccessToken();
  const entries = Object.entries(docsById);
  const CHUNK = 450;
  let written = 0;
  for (let i = 0; i < entries.length; i += CHUNK) {
    const chunk = entries.slice(i, i + CHUNK);
    const writes = chunk.map(([id, data]) => ({
      update: {
        name: `projects/${PROJECT}/databases/(default)/documents/${collection}/${id}`,
        fields: toFields(data),
      },
    }));
    const r = await httpsRequest({
      host: 'firestore.googleapis.com',
      path: `/v1/projects/${PROJECT}/databases/(default)/documents:commit`,
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }, { writes });
    if (r.status !== 200) throw new Error(`Commit falló (lote ${i}): ${r.status} ${r.body.slice(0, 400)}`);
    written += chunk.length;
    console.log(`  escritos ${written}/${entries.length}`);
  }
  return written;
}

// Cuenta documentos de una colección (para verificación).
export async function countDocs(collection) {
  const token = await getAccessToken();
  const r = await httpsRequest({
    host: 'firestore.googleapis.com',
    path: `/v1/projects/${PROJECT}/databases/(default)/documents:runAggregationQuery`,
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  }, { structuredAggregationQuery: { structuredQuery: { from: [{ collectionId: collection }] }, aggregations: [{ alias: 'count', count: {} }] } });
  if (r.status !== 200) throw new Error(`Count falló: ${r.status} ${r.body.slice(0, 400)}`);
  const parsed = JSON.parse(r.body);
  const result = Array.isArray(parsed) ? parsed.find(x => x.result) : parsed;
  return parseInt(result?.result?.aggregateFields?.count?.integerValue || '0', 10);
}
