// Migra los 547 apuntes de finanzas personales a la colección finTransactions.
// doc id = id entero original (idempotente: re-ejecutar sobreescribe, no duplica).
// Uso: node scripts/finanzas/migrate.mjs <ruta_al_export.json>
import fs from 'fs';
import { commitDocs, countDocs } from './firestoreRest.mjs';

const EXPORT_PATH = process.argv[2]
  || `${process.env.HOME}/workspaces/finanzas_personales/docs/finanzas_export.json`;

function toFinDoc(row) {
  return {
    id: String(row.id),
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
  const raw = JSON.parse(fs.readFileSync(EXPORT_PATH, 'utf8'));
  console.log(`Leídos ${raw.length} apuntes de ${EXPORT_PATH}`);

  const docsById = {};
  for (const row of raw) {
    if (row.id == null) throw new Error('Apunte sin id: ' + JSON.stringify(row));
    docsById[String(row.id)] = toFinDoc(row);
  }
  const uniqueIds = Object.keys(docsById).length;
  console.log(`IDs únicos: ${uniqueIds} (si < ${raw.length}, había ids repetidos en el export)`);

  const written = await commitDocs('finTransactions', docsById);
  console.log(`Escritos ${written} documentos.`);

  const total = await countDocs('finTransactions');
  console.log(`Total en Firestore finTransactions: ${total}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
