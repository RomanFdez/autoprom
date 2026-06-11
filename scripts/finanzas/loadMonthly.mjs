// Carga mensual de apuntes ya clasificados (por Claude a partir de los .xls de banco).
// doc id = hash determinista de fecha|importe|concepto|cuenta → recargar no duplica.
// Uso: node scripts/finanzas/loadMonthly.mjs <ruta_json_clasificado>
// El JSON es un array de { fecha, categoria, subcategoria, concepto, importe, tipo, cuenta }.
import fs from 'fs';
import crypto from 'crypto';
import { commitDocs, countDocs } from './firestoreRest.mjs';

function hashId(t) {
  const key = `${t.fecha}|${t.importe}|${t.concepto}|${t.cuenta}`;
  return crypto.createHash('sha1').update(key).digest('hex').slice(0, 20);
}

function toFinDoc(row) {
  const id = hashId(row);
  return {
    id,
    fecha: row.fecha,
    categoria: row.categoria,
    subcategoria: row.subcategoria ?? null,
    concepto: row.concepto ?? '',
    importe: Number(row.importe),
    tipo: row.tipo,
    cuenta: row.cuenta,
  };
}

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error('Falta la ruta al JSON clasificado.');
  const raw = JSON.parse(fs.readFileSync(path, 'utf8'));
  console.log(`Leídos ${raw.length} apuntes a cargar.`);

  const docsById = {};
  for (const row of raw) docsById[hashId(row)] = toFinDoc(row);
  console.log(`IDs únicos tras dedup: ${Object.keys(docsById).length}`);

  const before = await countDocs('finTransactions');
  const written = await commitDocs('finTransactions', docsById);
  const after = await countDocs('finTransactions');
  console.log(`Escritos ${written}. Total antes=${before}, después=${after}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
