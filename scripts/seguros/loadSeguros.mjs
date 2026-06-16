// Carga inicial de seguros a Firestore (colección 'seguros').
// El doc id es determinista (viene en el JSON), así que recargar no duplica.
// Uso: node scripts/seguros/loadSeguros.mjs [ruta_json]   (por defecto seguros_seed.json)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { commitDocs, countDocs } from '../finanzas/firestoreRest.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const jsonPath = process.argv[2] || path.join(__dirname, 'seguros_seed.json');
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Leídos ${raw.length} seguros desde ${jsonPath}.`);

  const docsById = {};
  for (const s of raw) {
    if (!s.id) throw new Error('Un seguro no trae id determinista: ' + JSON.stringify(s));
    docsById[s.id] = s;
  }
  console.log(`IDs únicos tras dedup: ${Object.keys(docsById).length}`);

  const before = await countDocs('seguros');
  const written = await commitDocs('seguros', docsById);
  const after = await countDocs('seguros');
  console.log(`Escritos ${written}. Total antes=${before}, después=${after}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
