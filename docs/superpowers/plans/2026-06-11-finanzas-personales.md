# Finanzas personales — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir una sección "Finanzas" (finanzas personales) a autoprom, con datos totalmente aislados de las finanzas de empresa, vista mensual + resumen anual con previsión, en web y móvil; migrar los 547 apuntes existentes a Firestore.

**Architecture:** Datos en una colección Firestore nueva `finTransactions` (proyecto `autoprom-84fe0`), aislada de `transactions` de empresa. Catálogos fijos en código. Lógica de resumen/previsión portada de `main.py` a un módulo JS puro probado con TDD. UI en web (`src/`) y móvil (`mobile/`) siguiendo el patrón de duplicación existente. La carga masiva de datos NO está en la app: la ejecuta Claude con un script Node que escribe en Firestore vía API REST usando la credencial del owner ya presente en el CLI de Firebase.

**Tech Stack:** React 19 + Vite + react-router-dom (web), Expo / React Native + react-navigation (móvil), Firebase Firestore (cliente), Vitest (tests), Node + Firestore REST API (script de ingesta).

**Spec de referencia:** `docs/superpowers/specs/2026-06-11-finanzas-personales-design.md`

---

## File Structure

**Compartido por convención (duplicado web/móvil, como ya hace el repo):**
- `src/finanzas/constants.js` / `mobile/src/finanzas/constants.js` — CATEGORIES, SUBCATEGORIES, CUENTAS, MONTHS, CAT_COLORS, helper `catColor()`.
- `src/finanzas/summary.js` / `mobile/src/finanzas/summary.js` — `getSummary()`, `getBreakdown()` (lógica pura).
- `src/finanzas/summary.test.js` — tests Vitest (solo en web; la lógica es idéntica, basta probarla una vez).

**Web (`src/`):**
- `src/context/FinanzasContext.jsx` — provider + listener `finTransactions` + CRUD.
- `src/components/FinTransactionForm.jsx` — modal añadir/editar apunte.
- `src/pages/Finanzas.jsx` — página con sub-tabs Mensual / Anual.
- `src/App.jsx` — ruta `/finanzas` (modificar).
- `src/components/Layout.jsx` — NavLink "Finanzas" (modificar).

**Móvil (`mobile/src/`):**
- `mobile/src/context/FinanzasContext.js` — provider + CRUD.
- `mobile/src/screens/FinanzasScreen.js` — pantalla con sub-tabs + form modal.
- `mobile/src/navigation/MainNavigator.js` — Tab "Finanzas" (modificar).
- `mobile/App.js` — montar `FinanzasProvider` (modificar).

**Script de ingesta (ejecuta Claude, no se usa desde la app):**
- `scripts/finanzas/firestoreRest.mjs` — auth (token desde firebase-tools) + `commitDocs()`.
- `scripts/finanzas/migrate.mjs` — migración de los 547 apuntes.
- `scripts/finanzas/loadMonthly.mjs` — plantilla de carga mensual (con dedup por hash).

**Config:**
- `vitest.config.js` — config de tests (crear).
- `package.json` — devDep `vitest` + script `test` (modificar).

---

## Phase 1 — Setup de tests y constantes

### Task 1: Configurar Vitest

**Files:**
- Create: `vitest.config.js`
- Modify: `package.json`

- [ ] **Step 1: Instalar vitest**

Run:
```bash
npm install -D vitest@^2.1.0
```
Expected: añade `vitest` a devDependencies sin errores.

- [ ] **Step 2: Crear `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
```

- [ ] **Step 3: Añadir script `test` en `package.json`**

En el bloque `"scripts"`, añade tras `"lint": "eslint .",`:
```json
    "test": "vitest run",
```

- [ ] **Step 4: Verificar que el runner arranca (sin tests aún)**

Run: `npm test`
Expected: vitest arranca y reporta "No test files found" (exit 0 o mensaje de no archivos). No errores de configuración.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.js
git commit -m "chore: configurar vitest para tests de finanzas"
```

---

### Task 2: Constantes y colores de finanzas (web)

**Files:**
- Create: `src/finanzas/constants.js`

- [ ] **Step 1: Crear `src/finanzas/constants.js`**

```js
// Catálogos fijos de finanzas personales (portados de main.py).
// NO mezclar con las categorías de empresa (DataContext / categories).

export const CATEGORIES = [
  "Casa JF", "Casa Madrid", "Casa SE", "Comida/Super", "Comisiones",
  "Compras varias", "Devolución", "Facturas", "Gasolina y Transporte",
  "Impuestos", "Ingreso Deuda", "Niños", "Nomina", "Ocio", "Seguros",
  "Subscripciones",
];

// Solo aplican a la categoría "Compras varias".
export const SUBCATEGORIES = [
  "Amazon", "Cafetería / Bar", "Compras Niños", "Delivery", "El Corte Inglés",
  "Farmacia", "Hogar", "Kiosco / Pequeñas compras", "Libros y Cultura",
  "Liquidación tarjeta Cajamar", "Mercado / Alimentación", "Ocio / Juegos",
  "Otros (revisar)", "Perfumería / Belleza", "Ropa y Calzado",
  "Tecnología / Dominios", "Wallapop (segunda mano)",
];

export const CATEGORY_WITH_SUBCATS = "Compras varias";

export const CUENTAS = ["ING", "IberiaCard", "Sabadell", "Cajamar"];

export const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// "background:foreground" (tomado del index.html de referencia).
const CAT_COLORS = {
  "Casa JF": "#DBEAFE:#1D4ED8",
  "Casa Madrid": "#DBEAFE:#1D4ED8",
  "Casa SE": "#DBEAFE:#1D4ED8",
  "Comida/Super": "#FEF3C7:#92400E",
  "Comisiones": "#F3F4F6:#374151",
  "Compras varias": "#EDE9FE:#5B21B6",
  "Devolución": "#CCFBF1:#0F766E",
  "Facturas": "#FEF9C3:#854D0E",
  "Gasolina y Transporte": "#FFEDD5:#9A3412",
  "Impuestos": "#FEE2E2:#991B1B",
  "Ingreso Deuda": "#D1FAE5:#065F46",
  "Niños": "#FCE7F3:#9D174D",
  "Nomina": "#DCFCE7:#166534",
  "Ocio": "#F3E8FF:#6B21A8",
  "Seguros": "#E2E8F0:#334155",
  "Subscripciones": "#CFFAFE:#155E75",
};

const CAT_COLOR_FALLBACK = "#F3F4F6:#374151";

// Devuelve { bg, fg } para una categoría.
export function catColor(cat) {
  const [bg, fg] = (CAT_COLORS[cat] || CAT_COLOR_FALLBACK).split(":");
  return { bg, fg };
}

// Colores de marca.
export const BRAND = {
  blue: "#0055B3",
  incomeText: "#166534",
  incomeBg: "#F0FDF4",
  incomeBorder: "#86EFAC",
  expenseText: "#991B1B",
  expenseBg: "#FFF5F5",
  expenseBorder: "#FCA5A5",
  balanceText: "#1E40AF",
  balanceBg: "#EFF6FF",
  balanceBorder: "#93C5FD",
};
```

- [ ] **Step 2: Commit**

```bash
git add src/finanzas/constants.js
git commit -m "feat(finanzas): catálogos y colores de finanzas personales (web)"
```

---

## Phase 2 — Lógica de resumen y previsión (TDD)

### Task 3: `getSummary` — test del caso base

**Files:**
- Create: `src/finanzas/summary.test.js`

- [ ] **Step 1: Escribir el test que falla**

```js
import { describe, it, expect } from 'vitest';
import { getSummary } from './summary';

// today fijo para determinismo: 15 mar 2026 → cur_month = 3.
const TODAY = new Date(2026, 2, 15);

const tx = (fecha, categoria, importe, subcategoria = null) => ({
  fecha, categoria, importe, subcategoria,
  concepto: 'x', tipo: importe < 0 ? 'Gasto' : 'Ingreso', cuenta: 'ING',
});

describe('getSummary', () => {
  it('pivota por categoría y mes, con meses sin datos a null', () => {
    const data = [
      tx('2026-01-10', 'Nomina', 2000),
      tx('2026-02-10', 'Nomina', 2000),
      tx('2026-01-15', 'Ocio', -50),
    ];
    const { rows } = getSummary(data, 2026, TODAY);
    const nomina = rows.find(r => r.categoria === 'Nomina');
    expect(nomina.meses['1']).toBe(2000);
    expect(nomina.meses['2']).toBe(2000);
    // marzo es mes actual pero sin datos → 0 (está en actual_months? no, no hay datos en marzo)
    // actual_months = meses con datos <= cur_month = {1,2}. Marzo NO tiene datos → null.
    expect(nomina.meses['3']).toBeNull();
    expect(nomina.meses['12']).toBeNull();
    expect(nomina.total_actual).toBe(4000);
  });

  it('calcula media y previsión: total + media*(12-n)', () => {
    const data = [
      tx('2026-01-10', 'Nomina', 2000),
      tx('2026-02-10', 'Nomina', 2000),
    ];
    // actual_months = {1,2} → n=2, remaining=10. total=4000, media=2000.
    const { rows } = getSummary(data, 2026, TODAY);
    const nomina = rows.find(r => r.categoria === 'Nomina');
    expect(nomina.media_mensual).toBe(2000);
    expect(nomina.prevision).toBe(4000 + 2000 * 10); // 24000
  });

  it('la fila TOTAL suma todas las categorías', () => {
    const data = [
      tx('2026-01-10', 'Nomina', 2000),
      tx('2026-01-15', 'Ocio', -50),
    ];
    const { total_row } = getSummary(data, 2026, TODAY);
    expect(total_row.categoria).toBe('TOTAL');
    expect(total_row.meses['1']).toBe(1950);
    expect(total_row.total_actual).toBe(1950);
  });
});
```

- [ ] **Step 2: Ejecutar para ver que falla**

Run: `npm test`
Expected: FAIL — `getSummary is not a function` / módulo `./summary` no existe.

- [ ] **Step 3: Implementar `src/finanzas/summary.js`**

```js
// Puerto JS de la lógica de main.py (get_summary / get_breakdown).
// Funciones puras: reciben el array de apuntes, no tocan red ni Firestore.

const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;

function monthOf(fecha) {
  // fecha = "YYYY-MM-DD"
  return parseInt(fecha.slice(5, 7), 10);
}

function currentMonth(year, today) {
  if (today.getFullYear() === year) return today.getMonth() + 1;
  if (today.getFullYear() > year) return 12;
  return 0;
}

// Construye filas pivote a partir de un map key->{month->sum}.
function buildRows(pivot, keyName, actualMonths) {
  const n = actualMonths.length;
  const remaining = 12 - n;
  const actualSet = new Set(actualMonths);
  return Object.keys(pivot).sort().map((key) => {
    const meses = {};
    let total = 0;
    for (let m = 1; m <= 12; m++) {
      if (actualSet.has(m)) {
        const v = pivot[key][m] || 0;
        meses[String(m)] = round2(v);
        total += v;
      } else {
        meses[String(m)] = null;
      }
    }
    const media = n > 0 ? total / n : 0;
    return {
      [keyName]: key,
      meses,
      total_actual: round2(total),
      media_mensual: round2(media),
      prevision: round2(total + media * remaining),
    };
  });
}

export function getSummary(transactions, year, today = new Date()) {
  const rowsForYear = transactions.filter(t => t.fecha.slice(0, 4) === String(year));

  const pivot = {};
  const monthsSeen = new Set();
  for (const r of rowsForYear) {
    const m = monthOf(r.fecha);
    pivot[r.categoria] = pivot[r.categoria] || {};
    pivot[r.categoria][m] = (pivot[r.categoria][m] || 0) + r.importe;
    monthsSeen.add(m);
  }

  const curMonth = currentMonth(year, today);
  const actualMonths = [...monthsSeen].filter(m => m <= curMonth).sort((a, b) => a - b);
  const n = actualMonths.length;
  const remaining = 12 - n;
  const actualSet = new Set(actualMonths);

  const rows = buildRows(pivot, 'categoria', actualMonths);

  // Fila TOTAL: suma de todas las categorías por mes.
  const allCats = Object.keys(pivot);
  const totalMeses = {};
  let grandTotal = 0;
  for (let m = 1; m <= 12; m++) {
    if (actualSet.has(m)) {
      const v = allCats.reduce((acc, c) => acc + (pivot[c][m] || 0), 0);
      totalMeses[String(m)] = round2(v);
      grandTotal += v;
    } else {
      totalMeses[String(m)] = null;
    }
  }
  const grandMedia = n > 0 ? grandTotal / n : 0;

  const catsWithSubcats = [...new Set(
    rowsForYear.filter(r => r.subcategoria != null).map(r => r.categoria)
  )];

  return {
    rows,
    total_row: {
      categoria: 'TOTAL',
      meses: totalMeses,
      total_actual: round2(grandTotal),
      media_mensual: round2(grandMedia),
      prevision: round2(grandTotal + grandMedia * remaining),
    },
    actual_months: actualMonths,
    cats_with_subcats: catsWithSubcats,
  };
}

export function getBreakdown(transactions, year, categoria, today = new Date()) {
  const rowsForYear = transactions.filter(
    t => t.fecha.slice(0, 4) === String(year) && t.categoria === categoria
  );

  const pivot = {};
  const monthsSeen = new Set();
  for (const r of rowsForYear) {
    const m = monthOf(r.fecha);
    const sub = r.subcategoria || '(sin subcategoría)';
    pivot[sub] = pivot[sub] || {};
    pivot[sub][m] = (pivot[sub][m] || 0) + r.importe;
    monthsSeen.add(m);
  }

  const curMonth = currentMonth(year, today);
  const actualMonths = [...monthsSeen].filter(m => m <= curMonth).sort((a, b) => a - b);

  return {
    rows: buildRows(pivot, 'subcategoria', actualMonths),
    actual_months: actualMonths,
  };
}
```

- [ ] **Step 4: Ejecutar para ver que pasa**

Run: `npm test`
Expected: PASS — los 3 tests de `getSummary` en verde.

- [ ] **Step 5: Commit**

```bash
git add src/finanzas/summary.js src/finanzas/summary.test.js
git commit -m "feat(finanzas): lógica de resumen y previsión (getSummary) con tests"
```

---

### Task 4: `getBreakdown` y casos de borde de año

**Files:**
- Modify: `src/finanzas/summary.test.js`

- [ ] **Step 1: Añadir tests que fallan**

Añade dentro del fichero, tras el bloque `describe('getSummary', ...)`:

```js
describe('getSummary — casos de año', () => {
  const data = [
    tx('2026-01-10', 'Nomina', 2000),
    tx('2026-02-10', 'Nomina', 2000),
  ];

  it('año pasado: cur_month=12, usa todos los meses con datos', () => {
    const future = new Date(2027, 0, 1); // today en 2027, year=2026 ya pasó
    const { actual_months } = getSummary(data, 2026, future);
    expect(actual_months).toEqual([1, 2]);
  });

  it('año futuro: cur_month=0, no hay meses reales → previsión 0', () => {
    const past = new Date(2025, 0, 1); // today en 2025, year=2026 es futuro
    const { rows, actual_months } = getSummary(data, 2026, past);
    expect(actual_months).toEqual([]);
    const nomina = rows.find(r => r.categoria === 'Nomina');
    expect(nomina.total_actual).toBe(0);
    expect(nomina.prevision).toBe(0);
    expect(nomina.meses['1']).toBeNull();
  });
});

describe('getBreakdown', () => {
  const TODAY2 = new Date(2026, 2, 15);
  const data = [
    tx('2026-01-05', 'Compras varias', -30, 'Amazon'),
    tx('2026-02-05', 'Compras varias', -20, 'Amazon'),
    tx('2026-01-08', 'Compras varias', -15, 'Farmacia'),
    tx('2026-01-09', 'Compras varias', -5), // sin subcategoría
  ];

  it('pivota por subcategoría, con (sin subcategoría) para nulls', () => {
    const { rows } = getBreakdown(data, 2026, 'Compras varias', TODAY2);
    const amazon = rows.find(r => r.subcategoria === 'Amazon');
    const sinSub = rows.find(r => r.subcategoria === '(sin subcategoría)');
    expect(amazon.total_actual).toBe(-50);
    expect(amazon.meses['1']).toBe(-30);
    expect(sinSub.total_actual).toBe(-5);
  });
});
```

Y añade el import de `getBreakdown` arriba:
```js
import { getSummary, getBreakdown } from './summary';
```
(reemplaza la línea de import existente).

- [ ] **Step 2: Ejecutar para ver que falla**

Run: `npm test`
Expected: los nuevos tests fallan si `getBreakdown` no estuviera exportado. (Si ya implementaste `getBreakdown` en Task 3, los tests deben pasar directamente — en ese caso confirma que cubren el comportamiento y sigue.)

- [ ] **Step 3: Verificar que pasan**

Run: `npm test`
Expected: PASS — todos los tests en verde (`getSummary` + casos de año + `getBreakdown`).

- [ ] **Step 4: Commit**

```bash
git add src/finanzas/summary.test.js
git commit -m "test(finanzas): cubrir getBreakdown y casos de año pasado/futuro"
```

---

## Phase 3 — Migración de los 547 apuntes (script ejecutado por Claude)

### Task 5: Helper de escritura en Firestore vía REST

**Files:**
- Create: `scripts/finanzas/firestoreRest.mjs`

- [ ] **Step 1: Crear `scripts/finanzas/firestoreRest.mjs`**

```js
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
```

- [ ] **Step 2: Verificar que el módulo carga y el token funciona**

Run:
```bash
node -e "import('./scripts/finanzas/firestoreRest.mjs').then(async m => { await m.getAccessToken(); console.log('token OK'); })"
```
Expected: imprime `token OK` sin errores.

- [ ] **Step 3: Commit**

```bash
git add scripts/finanzas/firestoreRest.mjs
git commit -m "feat(finanzas): helper de escritura en Firestore vía REST (cred. owner CLI)"
```

---

### Task 6: Script de migración y carga de los 547 apuntes

**Files:**
- Create: `scripts/finanzas/migrate.mjs`

- [ ] **Step 1: Crear `scripts/finanzas/migrate.mjs`**

```js
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
```

- [ ] **Step 2: Ejecutar la migración**

Run:
```bash
node scripts/finanzas/migrate.mjs
```
Expected: imprime "Leídos 547 apuntes", el progreso de escritura, y "Total en Firestore finTransactions: 547" (o el nº de ids únicos si el export tuviera duplicados — anotar el valor real).

- [ ] **Step 3: Verificación independiente del recuento**

Run:
```bash
node -e "import('./scripts/finanzas/firestoreRest.mjs').then(async m => console.log('count =', await m.countDocs('finTransactions')))"
```
Expected: `count = 547` (o el nº de ids únicos observado en Step 2). Confirmar que coincide.

- [ ] **Step 4: Commit**

```bash
git add scripts/finanzas/migrate.mjs
git commit -m "feat(finanzas): script de migración de los 547 apuntes a Firestore"
```

---

### Task 7: Plantilla de carga mensual (dedup por hash)

**Files:**
- Create: `scripts/finanzas/loadMonthly.mjs`

- [ ] **Step 1: Crear `scripts/finanzas/loadMonthly.mjs`**

```js
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
```

- [ ] **Step 2: Verificar que el script parsea (smoke test sin escribir)**

Run:
```bash
echo '[]' > /tmp/empty_finanzas.json && node scripts/finanzas/loadMonthly.mjs /tmp/empty_finanzas.json
```
Expected: "Leídos 0 apuntes", "IDs únicos tras dedup: 0", y total antes/después iguales. Sin errores.

- [ ] **Step 3: Commit**

```bash
git add scripts/finanzas/loadMonthly.mjs
git commit -m "feat(finanzas): plantilla de carga mensual con dedup por hash"
```

---

## Phase 4 — UI Web

### Task 8: FinanzasContext (web)

**Files:**
- Create: `src/context/FinanzasContext.jsx`

- [ ] **Step 1: Crear `src/context/FinanzasContext.jsx`**

```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebaseConfig';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const FinanzasContext = createContext();
const COLLECTION = 'finTransactions';

export const FinanzasProvider = ({ children }) => {
  const [finTransactions, setFinTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, COLLECTION), (snap) => {
      const data = snap.docs.map(d => d.data());
      data.sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
      setFinTransactions(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const addFin = async (t) => {
    const id = t.id || uuidv4();
    await setDoc(doc(db, COLLECTION, id), { ...t, id });
  };

  const updateFin = async (t) => {
    await setDoc(doc(db, COLLECTION, t.id), t, { merge: true });
  };

  const removeFin = async (id) => {
    await deleteDoc(doc(db, COLLECTION, id));
  };

  return (
    <FinanzasContext.Provider value={{ finTransactions, loading, addFin, updateFin, removeFin }}>
      {children}
    </FinanzasContext.Provider>
  );
};

export const useFinanzas = () => useContext(FinanzasContext);
```

- [ ] **Step 2: Verificar que compila (build)**

Run: `npm run build`
Expected: build OK (el contexto aún no se usa, pero no debe romper).

- [ ] **Step 3: Commit**

```bash
git add src/context/FinanzasContext.jsx
git commit -m "feat(finanzas): FinanzasContext con listener finTransactions y CRUD (web)"
```

---

### Task 9: Modal de alta/edición de apunte (web)

**Files:**
- Create: `src/components/FinTransactionForm.jsx`

- [ ] **Step 1: Crear `src/components/FinTransactionForm.jsx`**

```jsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { useFinanzas } from '../context/FinanzasContext';
import {
  CATEGORIES, SUBCATEGORIES, CUENTAS, CATEGORY_WITH_SUBCATS,
} from '../finanzas/constants';

// Convierte el importe (valor absoluto que teclea el usuario) + tipo a importe firmado.
function signedImporte(absValue, tipo) {
  const n = Math.abs(parseFloat(absValue) || 0);
  return tipo === 'Gasto' ? -n : n;
}

export default function FinTransactionForm({ onClose, initialData }) {
  const { addFin, updateFin } = useFinanzas();
  const editing = !!initialData;

  const [fecha, setFecha] = useState(initialData?.fecha || new Date().toISOString().slice(0, 10));
  const [categoria, setCategoria] = useState(initialData?.categoria || CATEGORIES[0]);
  const [subcategoria, setSubcategoria] = useState(initialData?.subcategoria || '');
  const [concepto, setConcepto] = useState(initialData?.concepto || '');
  const [importeAbs, setImporteAbs] = useState(
    initialData ? Math.abs(initialData.importe).toString() : ''
  );
  const [tipo, setTipo] = useState(initialData?.tipo || 'Gasto');
  const [cuenta, setCuenta] = useState(initialData?.cuenta || CUENTAS[0]);

  const showSubcat = categoria === CATEGORY_WITH_SUBCATS;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const doc = {
      ...(initialData || {}),
      fecha,
      categoria,
      subcategoria: showSubcat ? (subcategoria || null) : null,
      concepto,
      importe: signedImporte(importeAbs, tipo),
      tipo,
      cuenta,
    };
    if (editing) await updateFin(doc);
    else await addFin(doc);
    onClose();
  };

  return (
    <div className="fin-overlay" onClick={onClose}>
      <div className="fin-modal" onClick={e => e.stopPropagation()}>
        <div className="fin-modal-header">
          <h3>{editing ? 'Editar apunte' : 'Nuevo apunte'}</h3>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="fin-form">
          <label>Fecha
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required />
          </label>
          <label>Tipo
            <select value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="Gasto">Gasto</option>
              <option value="Ingreso">Ingreso</option>
            </select>
          </label>
          <label>Importe (€)
            <input type="number" step="0.01" value={importeAbs}
              onChange={e => setImporteAbs(e.target.value)} required />
          </label>
          <label>Categoría
            <select value={categoria} onChange={e => setCategoria(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          {showSubcat && (
            <label>Subcategoría
              <select value={subcategoria} onChange={e => setSubcategoria(e.target.value)}>
                <option value="">(ninguna)</option>
                {SUBCATEGORIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          )}
          <label>Cuenta
            <select value={cuenta} onChange={e => setCuenta(e.target.value)}>
              {CUENTAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>Concepto
            <input type="text" value={concepto} onChange={e => setConcepto(e.target.value)} />
          </label>
          <button type="submit" className="fin-save">{editing ? 'Guardar' : 'Añadir'}</button>
        </form>
        <style>{`
          .fin-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000;
            display: flex; justify-content: center; align-items: flex-start; padding-top: 60px; }
          .fin-modal { background: #fff; color: #1D1D1F; width: 90%; max-width: 460px;
            border-radius: 14px; box-shadow: 0 8px 30px rgba(0,0,0,0.25); overflow: hidden; }
          .fin-modal-header { display: flex; justify-content: space-between; align-items: center;
            padding: 14px 18px; border-bottom: 1px solid #E5E5EA; }
          .fin-modal-header h3 { margin: 0; font-size: 1.05rem; }
          .fin-modal-header button { border: none; background: none; cursor: pointer; color: #6E6E73; }
          .fin-form { display: flex; flex-direction: column; gap: 10px; padding: 16px 18px; }
          .fin-form label { display: flex; flex-direction: column; font-size: 0.8rem; color: #6E6E73; gap: 4px; }
          .fin-form input, .fin-form select { font-size: 0.95rem; padding: 8px 10px;
            border: 1px solid #D2D2D7; border-radius: 8px; background: #FAFAFA; color: #1D1D1F; }
          .fin-save { margin-top: 6px; background: #0055B3; color: #fff; border: none;
            padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; }
        `}</style>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 3: Commit**

```bash
git add src/components/FinTransactionForm.jsx
git commit -m "feat(finanzas): modal de alta/edición de apunte (web)"
```

---

### Task 10: Página Finanzas — vista Mensual (web)

**Files:**
- Create: `src/pages/Finanzas.jsx`

- [ ] **Step 1: Crear `src/pages/Finanzas.jsx` con la vista Mensual**

```jsx
import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useFinanzas } from '../context/FinanzasContext';
import FinTransactionForm from '../components/FinTransactionForm';
import { CATEGORIES, CUENTAS, MONTHS, catColor, BRAND } from '../finanzas/constants';

export default function Finanzas() {
  const { finTransactions } = useFinanzas();
  const [tab, setTab] = useState('mensual'); // 'mensual' | 'anual'
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  return (
    <div className="fin-page">
      <div className="fin-tabs">
        <button className={tab === 'mensual' ? 'active' : ''} onClick={() => setTab('mensual')}>Mensual</button>
        <button className={tab === 'anual' ? 'active' : ''} onClick={() => setTab('anual')}>Anual</button>
        <div className="fin-year">
          <label>Año </label>
          <select value={year} onChange={e => setYear(parseInt(e.target.value, 10))}>
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {tab === 'mensual'
        ? <MensualView data={finTransactions} month={month} year={year} setMonth={setMonth} />
        : <AnualView data={finTransactions} year={year} />}

      <style>{`
        .fin-page { padding-bottom: 100px; color: #1D1D1F; }
        .fin-tabs { display: flex; align-items: center; gap: 6px; margin-bottom: 14px; }
        .fin-tabs > button { border: none; background: #EBEBED; color: #6E6E73; padding: 7px 16px;
          border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem; }
        .fin-tabs > button.active { background: ${BRAND.blue}; color: #fff; }
        .fin-year { margin-left: auto; font-size: 0.85rem; color: #6E6E73; }
        .fin-year select { border: 1px solid #D2D2D7; border-radius: 6px; padding: 4px 8px;
          background: #FAFAFA; margin-left: 4px; }
      `}</style>
    </div>
  );
}

function MensualView({ data, month, year, setMonth }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [qConcepto, setQConcepto] = useState('');
  const [fCuenta, setFCuenta] = useState('');
  const [fCategoria, setFCategoria] = useState('');
  const { removeFin, updateFin } = useFinanzas();

  const monthRows = useMemo(() => {
    const mm = String(month).padStart(2, '0');
    return data
      .filter(t => t.fecha.slice(0, 4) === String(year) && t.fecha.slice(5, 7) === mm)
      .filter(t => !qConcepto || (t.concepto || '').toLowerCase().includes(qConcepto.toLowerCase()))
      .filter(t => !fCuenta || t.cuenta === fCuenta)
      .filter(t => !fCategoria || t.categoria === fCategoria);
  }, [data, month, year, qConcepto, fCuenta, fCategoria]);

  const totals = useMemo(() => {
    let ingresos = 0, gastos = 0;
    for (const t of monthRows) { if (t.importe >= 0) ingresos += t.importe; else gastos += t.importe; }
    return { ingresos, gastos, balance: ingresos + gastos };
  }, [monthRows]);

  const recategorize = (t) => {
    const next = prompt(`Nueva categoría para "${t.concepto}":\n${CATEGORIES.join(', ')}`, t.categoria);
    if (next && CATEGORIES.includes(next)) updateFin({ ...t, categoria: next });
  };

  return (
    <div>
      <div className="fin-monthbar">
        {MONTHS.map((m, i) => (
          <button key={m} className={`fin-pill ${month === i + 1 ? 'active' : ''}`}
            onClick={() => setMonth(i + 1)}>{m.slice(0, 3)}</button>
        ))}
      </div>

      <div className="fin-cards">
        <div className="fin-card" style={{ background: BRAND.incomeBg, borderColor: BRAND.incomeBorder }}>
          <span style={{ color: BRAND.incomeText }}>Ingresos</span>
          <strong style={{ color: BRAND.incomeText }}>{totals.ingresos.toFixed(2)} €</strong>
        </div>
        <div className="fin-card" style={{ background: BRAND.expenseBg, borderColor: BRAND.expenseBorder }}>
          <span style={{ color: BRAND.expenseText }}>Gastos</span>
          <strong style={{ color: BRAND.expenseText }}>{totals.gastos.toFixed(2)} €</strong>
        </div>
        <div className="fin-card" style={{ background: BRAND.balanceBg, borderColor: BRAND.balanceBorder }}>
          <span style={{ color: BRAND.balanceText }}>Balance</span>
          <strong style={{ color: BRAND.balanceText }}>{totals.balance.toFixed(2)} €</strong>
        </div>
      </div>

      <div className="fin-filters">
        <input placeholder="Buscar concepto…" value={qConcepto} onChange={e => setQConcepto(e.target.value)} />
        <select value={fCuenta} onChange={e => setFCuenta(e.target.value)}>
          <option value="">Todas las cuentas</option>
          {CUENTAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={fCategoria} onChange={e => setFCategoria(e.target.value)}>
          <option value="">Todas las categorías</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <table className="fin-table">
        <thead>
          <tr><th>Fecha</th><th>Categoría</th><th>Subcat.</th><th>Concepto</th><th>Cuenta</th><th className="num">Importe</th><th></th></tr>
        </thead>
        <tbody>
          {monthRows.map(t => {
            const { bg, fg } = catColor(t.categoria);
            return (
              <tr key={t.id}>
                <td>{t.fecha.slice(8, 10)}/{t.fecha.slice(5, 7)}</td>
                <td><span className="fin-badge" style={{ background: bg, color: fg }}
                  onClick={() => recategorize(t)} title="Cambiar categoría">{t.categoria}</span></td>
                <td>{t.subcategoria || ''}</td>
                <td>{t.concepto}</td>
                <td>{t.cuenta}</td>
                <td className="num" style={{ color: t.importe >= 0 ? BRAND.incomeText : BRAND.expenseText }}>
                  {t.importe.toFixed(2)} €</td>
                <td className="actions">
                  <button onClick={() => { setEditing(t); setIsFormOpen(true); }}><Edit2 size={15} /></button>
                  <button onClick={() => { if (confirm('¿Eliminar apunte?')) removeFin(t.id); }}><Trash2 size={15} /></button>
                </td>
              </tr>
            );
          })}
          {monthRows.length === 0 && <tr><td colSpan="7" className="empty">Sin apuntes</td></tr>}
        </tbody>
      </table>

      <button className="fin-fab" onClick={() => { setEditing(null); setIsFormOpen(true); }}><Plus size={24} /></button>
      {isFormOpen && <FinTransactionForm onClose={() => setIsFormOpen(false)} initialData={editing} />}

      <style>{`
        .fin-monthbar { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px; }
        .fin-pill { border: none; background: transparent; color: #6E6E73; padding: 4px 10px;
          border-radius: 16px; font-size: 0.8rem; cursor: pointer; }
        .fin-pill.active { background: ${BRAND.blue}; color: #fff; }
        .fin-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
        .fin-card { border: 1px solid; border-radius: 14px; padding: 12px 14px; display: flex;
          flex-direction: column; gap: 4px; }
        .fin-card span { font-size: 0.72rem; text-transform: uppercase; letter-spacing: .04em; }
        .fin-card strong { font-size: 1.15rem; }
        .fin-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .fin-filters input, .fin-filters select { border: 1px solid #D2D2D7; border-radius: 8px;
          padding: 7px 10px; background: #FAFAFA; font-size: 0.85rem; }
        .fin-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px;
          overflow: hidden; font-size: 0.82rem; }
        .fin-table th { text-align: left; background: #FAFAFA; color: #6E6E73; text-transform: uppercase;
          font-size: 0.68rem; padding: 8px 10px; border-bottom: 1px solid #E5E5EA; }
        .fin-table td { padding: 7px 10px; border-bottom: 1px solid #F0F0F0; }
        .fin-table .num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
        .fin-badge { padding: 2px 8px; border-radius: 20px; font-size: 0.72rem; cursor: pointer; }
        .fin-table .actions { white-space: nowrap; }
        .fin-table .actions button { border: none; background: none; cursor: pointer; color: #6E6E73; padding: 2px; }
        .fin-table .empty { text-align: center; color: #AEAEB2; font-style: italic; padding: 20px; }
        .fin-fab { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 28px;
          background: ${BRAND.blue}; color: #fff; border: none; display: flex; align-items: center;
          justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 1000; }
      `}</style>
    </div>
  );
}

// Placeholder temporal — se implementa en la Task 11.
function AnualView() {
  return <div style={{ padding: 20, color: '#6E6E73' }}>Resumen anual (pendiente)</div>;
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Finanzas.jsx
git commit -m "feat(finanzas): página Finanzas con vista Mensual (web)"
```

---

### Task 11: Vista Anual con pivote, previsión y drill-down (web)

**Files:**
- Modify: `src/pages/Finanzas.jsx`

- [ ] **Step 1: Sustituir el `AnualView` placeholder por la implementación real**

Reemplaza la función `AnualView` placeholder al final de `src/pages/Finanzas.jsx` por:

```jsx
function AnualView({ data, year }) {
  const [open, setOpen] = useState({}); // categoria -> bool (drill-down abierto)
  const summary = useMemo(() => getSummary(data, year), [data, year]);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const fmt = (v) => (v == null ? '—' : v.toFixed(2));

  const toggle = (cat) => setOpen(o => ({ ...o, [cat]: !o[cat] }));

  return (
    <div className="fin-anual-wrap">
      <table className="fin-anual">
        <thead>
          <tr>
            <th>Categoría</th>
            {months.map(m => <th key={m} className="num">{MONTHS[m - 1].slice(0, 3)}</th>)}
            <th className="num">Total</th><th className="num">Media</th><th className="num">Previsión</th>
          </tr>
        </thead>
        <tbody>
          {summary.rows.map(row => {
            const { bg, fg } = catColor(row.categoria);
            const hasSub = summary.cats_with_subcats.includes(row.categoria);
            return (
              <CategoriaRows key={row.categoria} row={row} months={months} fmt={fmt}
                bg={bg} fg={fg} hasSub={hasSub} isOpen={!!open[row.categoria]}
                onToggle={() => toggle(row.categoria)} data={data} year={year} />
            );
          })}
          <tr className="fin-total">
            <td>TOTAL</td>
            {months.map(m => <td key={m} className="num">{fmt(summary.total_row.meses[String(m)])}</td>)}
            <td className="num">{fmt(summary.total_row.total_actual)}</td>
            <td className="num">{fmt(summary.total_row.media_mensual)}</td>
            <td className="num">{fmt(summary.total_row.prevision)}</td>
          </tr>
        </tbody>
      </table>

      <style>{`
        .fin-anual-wrap { overflow-x: auto; }
        .fin-anual { border-collapse: collapse; font-size: 0.75rem; background: #fff; min-width: 900px; }
        .fin-anual th { background: #FAFAFA; color: #6E6E73; text-transform: uppercase; font-size: 0.62rem;
          padding: 7px 8px; border-bottom: 1px solid #E5E5EA; position: sticky; top: 0; }
        .fin-anual td { padding: 6px 8px; border-bottom: 1px solid #F0F0F0; white-space: nowrap; }
        .fin-anual .num { text-align: right; font-variant-numeric: tabular-nums; }
        .fin-anual .fin-total td { font-weight: 700; background: #FAFAFA; border-top: 2px solid #E5E5EA; }
        .fin-anual .fin-badge { padding: 2px 8px; border-radius: 20px; font-size: 0.7rem; }
        .fin-anual .caret { cursor: pointer; user-select: none; margin-right: 4px; color: #6E6E73; }
        .fin-anual .sub td { color: #6E6E73; background: #FCFCFD; }
        .fin-anual .sub td:first-child { padding-left: 24px; font-style: italic; }
      `}</style>
    </div>
  );
}

function CategoriaRows({ row, months, fmt, bg, fg, hasSub, isOpen, onToggle, data, year }) {
  const breakdown = useMemo(
    () => (isOpen ? getBreakdown(data, year, row.categoria) : null),
    [isOpen, data, year, row.categoria]
  );
  return (
    <>
      <tr>
        <td>
          {hasSub && <span className="caret" onClick={onToggle}>{isOpen ? '▼' : '▶'}</span>}
          <span className="fin-badge" style={{ background: bg, color: fg }}>{row.categoria}</span>
        </td>
        {months.map(m => <td key={m} className="num">{fmt(row.meses[String(m)])}</td>)}
        <td className="num">{fmt(row.total_actual)}</td>
        <td className="num">{fmt(row.media_mensual)}</td>
        <td className="num">{fmt(row.prevision)}</td>
      </tr>
      {isOpen && breakdown && breakdown.rows.map(sub => (
        <tr key={sub.subcategoria} className="sub">
          <td>{sub.subcategoria}</td>
          {months.map(m => <td key={m} className="num">{fmt(sub.meses[String(m)])}</td>)}
          <td className="num">{fmt(sub.total_actual)}</td>
          <td className="num">{fmt(sub.media_mensual)}</td>
          <td className="num">{fmt(sub.prevision)}</td>
        </tr>
      ))}
    </>
  );
}
```

- [ ] **Step 2: Añadir el import de la lógica de summary**

En la cabecera de `src/pages/Finanzas.jsx`, añade junto a los otros imports de `../finanzas/constants`:
```jsx
import { getSummary, getBreakdown } from '../finanzas/summary';
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Finanzas.jsx
git commit -m "feat(finanzas): vista Anual con pivote, previsión y drill-down (web)"
```

---

### Task 12: Ruta y navegación "Finanzas" (web)

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/Layout.jsx`

- [ ] **Step 1: Registrar la página lazy y la ruta en `src/App.jsx`**

Añade el import lazy junto a los demás (tras la línea de `Statistics`):
```jsx
const Finanzas = lazy(() => import('./pages/Finanzas'));
```

Importa el provider (tras el import de `DataProvider`):
```jsx
import { FinanzasProvider } from './context/FinanzasContext';
```

Dentro de `<Route path="/" element={<ProtectedRoute />}>`, añade la ruta (tras la de `avance`):
```jsx
              <Route path="finanzas" element={<FinanzasProvider><Finanzas /></FinanzasProvider>} />
```

- [ ] **Step 2: Añadir el NavLink en `src/components/Layout.jsx`**

En el import de iconos de `lucide-react` (línea 3), añade `Wallet`:
```jsx
import { LayoutList, PieChart, Settings, TrendingUp, Moon, Sun, BarChart2, Wallet } from 'lucide-react';
```

Dentro de `<div className="nav-center">`, añade tras el NavLink de `/avance`:
```jsx
          <NavLink to="/finanzas" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Wallet size={18} />
            <span>Finanzas</span>
          </NavLink>
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 4: Verificación en navegador**

Run: `npm run dev` (Vite arranca en :5173). Inicia sesión y abre `/finanzas`.
Comprobar manualmente:
- El item "Finanzas" aparece en la barra de navegación.
- La vista Mensual muestra los apuntes del mes seleccionado, las 3 tarjetas cuadran (Balance = Ingresos + Gastos), los filtros funcionan, y crear/editar/borrar un apunte de prueba se refleja al instante (Firestore en tiempo real).
- La vista Anual muestra el pivote, los "—" en meses sin datos, las columnas Total/Media/Previsión, la fila TOTAL, y el drill-down por subcategoría en "Compras varias".
- Que NO aparece nada de finanzas personales mezclado en las pestañas de empresa (Inicio/Movimientos/etc.) ni viceversa.

> Nota para el ejecutor: usa el workflow de preview (`preview_*`) para verificar y capturar evidencia; no pidas al usuario que lo compruebe a mano.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/components/Layout.jsx
git commit -m "feat(finanzas): ruta /finanzas y NavLink en la navegación (web)"
```

---

## Phase 5 — UI Móvil

### Task 13: Constantes y lógica de summary (móvil)

**Files:**
- Create: `mobile/src/finanzas/constants.js`
- Create: `mobile/src/finanzas/summary.js`

- [ ] **Step 1: Copiar las constantes**

Crea `mobile/src/finanzas/constants.js` con **exactamente el mismo contenido** que `src/finanzas/constants.js` (Task 2). Es una copia literal — el repo ya duplica utilidades entre web y móvil.

- [ ] **Step 2: Copiar la lógica de summary**

Crea `mobile/src/finanzas/summary.js` con **exactamente el mismo contenido** que `src/finanzas/summary.js` (Task 3, tras quedar verde en Task 4). Copia literal.

- [ ] **Step 3: Verificar que la copia es idéntica**

Run:
```bash
diff src/finanzas/constants.js mobile/src/finanzas/constants.js && diff src/finanzas/summary.js mobile/src/finanzas/summary.js && echo "IDÉNTICOS"
```
Expected: imprime `IDÉNTICOS` (sin diferencias).

- [ ] **Step 4: Commit**

```bash
git add mobile/src/finanzas/constants.js mobile/src/finanzas/summary.js
git commit -m "feat(finanzas): constantes y lógica de summary (móvil, copia de web)"
```

---

### Task 14: FinanzasContext (móvil)

**Files:**
- Create: `mobile/src/context/FinanzasContext.js`
- Modify: `mobile/App.js`

- [ ] **Step 1: Crear `mobile/src/context/FinanzasContext.js`**

```js
import React, { createContext, useContext, useState, useEffect } from 'react';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebaseConfig';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const FinanzasContext = createContext();
const COLLECTION = 'finTransactions';

export const FinanzasProvider = ({ children }) => {
  const [finTransactions, setFinTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, COLLECTION), (snap) => {
      const data = snap.docs.map(d => d.data());
      data.sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
      setFinTransactions(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const addFin = async (t) => {
    const id = t.id || uuidv4();
    await setDoc(doc(db, COLLECTION, id), { ...t, id });
  };
  const updateFin = async (t) => { await setDoc(doc(db, COLLECTION, t.id), t, { merge: true }); };
  const removeFin = async (id) => { await deleteDoc(doc(db, COLLECTION, id)); };

  return (
    <FinanzasContext.Provider value={{ finTransactions, loading, addFin, updateFin, removeFin }}>
      {children}
    </FinanzasContext.Provider>
  );
};

export const useFinanzas = () => useContext(FinanzasContext);
```

- [ ] **Step 2: Montar el provider en `mobile/App.js`**

Lee `mobile/App.js`. Importa el provider:
```js
import { FinanzasProvider } from './src/context/FinanzasContext';
```
Envuelve el árbol existente (junto al `DataProvider`/`AuthProvider` que ya haya) añadiendo `<FinanzasProvider>...</FinanzasProvider>` como wrapper interior, de forma que el `AppNavigator` quede dentro de `FinanzasProvider`. (Sigue el mismo anidamiento que el `DataProvider` actual.)

- [ ] **Step 3: Verificar que el bundler no rompe**

Run:
```bash
cd mobile && npx expo export --platform web --output-dir /tmp/expo_finanzas_check 2>&1 | tail -20; cd ..
```
Expected: el export termina sin errores de import/sintaxis. (Si `expo export` no está disponible en el entorno, sustituir por `cd mobile && node -e "require('@babel/core')"` como smoke mínimo y revisar sintaxis a mano.)

- [ ] **Step 4: Commit**

```bash
git add mobile/src/context/FinanzasContext.js mobile/App.js
git commit -m "feat(finanzas): FinanzasContext y provider montado (móvil)"
```

---

### Task 15: Pantalla Finanzas (móvil) — Mensual + Anual + form

**Files:**
- Create: `mobile/src/screens/FinanzasScreen.js`

- [ ] **Step 1: Crear `mobile/src/screens/FinanzasScreen.js`**

```js
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, Trash2 } from 'lucide-react-native';
import { useFinanzas } from '../context/FinanzasContext';
import {
  CATEGORIES, SUBCATEGORIES, CUENTAS, MONTHS, CATEGORY_WITH_SUBCATS, catColor, BRAND,
} from '../finanzas/constants';
import { getSummary, getBreakdown } from '../finanzas/summary';

export default function FinanzasScreen() {
  const { finTransactions } = useFinanzas();
  const [tab, setTab] = useState('mensual');
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'mensual' && styles.tabActive]} onPress={() => setTab('mensual')}>
          <Text style={[styles.tabText, tab === 'mensual' && styles.tabTextActive]}>Mensual</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'anual' && styles.tabActive]} onPress={() => setTab('anual')}>
          <Text style={[styles.tabText, tab === 'anual' && styles.tabTextActive]}>Anual</Text>
        </TouchableOpacity>
        <Text style={styles.year}>{year}</Text>
      </View>
      {tab === 'mensual'
        ? <Mensual data={finTransactions} month={month} year={year} setMonth={setMonth} />
        : <Anual data={finTransactions} year={year} />}
    </SafeAreaView>
  );
}

function Mensual({ data, month, year, setMonth }) {
  const { addFin, updateFin, removeFin } = useFinanzas();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const mm = String(month).padStart(2, '0');
    return data
      .filter(t => t.fecha.slice(0, 4) === String(year) && t.fecha.slice(5, 7) === mm)
      .filter(t => !q || (t.concepto || '').toLowerCase().includes(q.toLowerCase()));
  }, [data, month, year, q]);

  const totals = useMemo(() => {
    let ing = 0, gas = 0;
    for (const t of rows) { if (t.importe >= 0) ing += t.importe; else gas += t.importe; }
    return { ing, gas, bal: ing + gas };
  }, [rows]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthbar}>
        {MONTHS.map((m, i) => (
          <TouchableOpacity key={m} onPress={() => setMonth(i + 1)}
            style={[styles.pill, month === i + 1 && styles.pillActive]}>
            <Text style={[styles.pillText, month === i + 1 && styles.pillTextActive]}>{m.slice(0, 3)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.cards}>
        <Card label="Ingresos" value={totals.ing} bg={BRAND.incomeBg} color={BRAND.incomeText} />
        <Card label="Gastos" value={totals.gas} bg={BRAND.expenseBg} color={BRAND.expenseText} />
        <Card label="Balance" value={totals.bal} bg={BRAND.balanceBg} color={BRAND.balanceText} />
      </View>

      <TextInput style={styles.search} placeholder="Buscar concepto…" value={q} onChangeText={setQ} />

      <ScrollView style={{ flex: 1 }}>
        {rows.map(t => {
          const c = catColor(t.categoria);
          return (
            <TouchableOpacity key={t.id} style={styles.row}
              onPress={() => { setEditing(t); setFormOpen(true); }}
              onLongPress={() => Alert.alert('Eliminar', '¿Eliminar apunte?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => removeFin(t.id) },
              ])}>
              <View style={{ flex: 1 }}>
                <Text style={styles.concept}>{t.concepto || t.categoria}</Text>
                <View style={styles.rowMeta}>
                  <View style={[styles.badge, { backgroundColor: c.bg }]}>
                    <Text style={{ color: c.fg, fontSize: 11 }}>{t.categoria}</Text>
                  </View>
                  <Text style={styles.metaText}>{t.cuenta} · {t.fecha.slice(8, 10)}/{t.fecha.slice(5, 7)}</Text>
                </View>
              </View>
              <Text style={{ color: t.importe >= 0 ? BRAND.incomeText : BRAND.expenseText, fontWeight: '700' }}>
                {t.importe.toFixed(2)} €
              </Text>
            </TouchableOpacity>
          );
        })}
        {rows.length === 0 && <Text style={styles.empty}>Sin apuntes</Text>}
        <View style={{ height: 90 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => { setEditing(null); setFormOpen(true); }}>
        <Plus color="#fff" size={26} />
      </TouchableOpacity>

      <FinForm visible={formOpen} onClose={() => setFormOpen(false)} initialData={editing}
        addFin={addFin} updateFin={updateFin} defaultDate={`${year}-${String(month).padStart(2, '0')}-01`} />
    </View>
  );
}

function Card({ label, value, bg, color }) {
  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <Text style={[styles.cardLabel, { color }]}>{label}</Text>
      <Text style={[styles.cardValue, { color }]}>{value.toFixed(2)} €</Text>
    </View>
  );
}

function Anual({ data, year }) {
  const summary = useMemo(() => getSummary(data, year), [data, year]);
  const [open, setOpen] = useState({});
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const fmt = (v) => (v == null ? '—' : v.toFixed(0));

  return (
    <ScrollView style={{ flex: 1 }}>
      <ScrollView horizontal>
        <View>
          <View style={[styles.tr, styles.thead]}>
            <Text style={[styles.th, styles.catCol]}>Categoría</Text>
            {months.map(m => <Text key={m} style={styles.th}>{MONTHS[m - 1].slice(0, 3)}</Text>)}
            <Text style={styles.th}>Total</Text>
            <Text style={styles.th}>Media</Text>
            <Text style={styles.th}>Prev.</Text>
          </View>
          {summary.rows.map(row => {
            const c = catColor(row.categoria);
            const hasSub = summary.cats_with_subcats.includes(row.categoria);
            const isOpen = !!open[row.categoria];
            const bd = isOpen ? getBreakdown(data, year, row.categoria) : null;
            return (
              <View key={row.categoria}>
                <TouchableOpacity style={styles.tr} disabled={!hasSub}
                  onPress={() => setOpen(o => ({ ...o, [row.categoria]: !o[row.categoria] }))}>
                  <Text style={[styles.td, styles.catCol]} numberOfLines={1}>
                    {hasSub ? (isOpen ? '▼ ' : '▶ ') : '   '}
                    <Text style={{ color: c.fg }}>{row.categoria}</Text>
                  </Text>
                  {months.map(m => <Text key={m} style={styles.td}>{fmt(row.meses[String(m)])}</Text>)}
                  <Text style={styles.td}>{fmt(row.total_actual)}</Text>
                  <Text style={styles.td}>{fmt(row.media_mensual)}</Text>
                  <Text style={styles.td}>{fmt(row.prevision)}</Text>
                </TouchableOpacity>
                {isOpen && bd && bd.rows.map(sub => (
                  <View key={sub.subcategoria} style={[styles.tr, styles.subRow]}>
                    <Text style={[styles.td, styles.catCol, styles.subText]} numberOfLines={1}>  {sub.subcategoria}</Text>
                    {months.map(m => <Text key={m} style={[styles.td, styles.subText]}>{fmt(sub.meses[String(m)])}</Text>)}
                    <Text style={[styles.td, styles.subText]}>{fmt(sub.total_actual)}</Text>
                    <Text style={[styles.td, styles.subText]}>{fmt(sub.media_mensual)}</Text>
                    <Text style={[styles.td, styles.subText]}>{fmt(sub.prevision)}</Text>
                  </View>
                ))}
              </View>
            );
          })}
          <View style={[styles.tr, styles.totalRow]}>
            <Text style={[styles.td, styles.catCol, { fontWeight: '700' }]}>TOTAL</Text>
            {months.map(m => <Text key={m} style={[styles.td, { fontWeight: '700' }]}>{fmt(summary.total_row.meses[String(m)])}</Text>)}
            <Text style={[styles.td, { fontWeight: '700' }]}>{fmt(summary.total_row.total_actual)}</Text>
            <Text style={[styles.td, { fontWeight: '700' }]}>{fmt(summary.total_row.media_mensual)}</Text>
            <Text style={[styles.td, { fontWeight: '700' }]}>{fmt(summary.total_row.prevision)}</Text>
          </View>
        </View>
      </ScrollView>
    </ScrollView>
  );
}

function FinForm({ visible, onClose, initialData, addFin, updateFin, defaultDate }) {
  const editing = !!initialData;
  const [fecha, setFecha] = useState(defaultDate);
  const [categoria, setCategoria] = useState(CATEGORIES[0]);
  const [subcategoria, setSubcategoria] = useState('');
  const [concepto, setConcepto] = useState('');
  const [importeAbs, setImporteAbs] = useState('');
  const [tipo, setTipo] = useState('Gasto');
  const [cuenta, setCuenta] = useState(CUENTAS[0]);

  React.useEffect(() => {
    if (!visible) return;
    if (initialData) {
      setFecha(initialData.fecha);
      setCategoria(initialData.categoria);
      setSubcategoria(initialData.subcategoria || '');
      setConcepto(initialData.concepto || '');
      setImporteAbs(Math.abs(initialData.importe).toString());
      setTipo(initialData.tipo || 'Gasto');
      setCuenta(initialData.cuenta || CUENTAS[0]);
    } else {
      setFecha(defaultDate); setCategoria(CATEGORIES[0]); setSubcategoria('');
      setConcepto(''); setImporteAbs(''); setTipo('Gasto'); setCuenta(CUENTAS[0]);
    }
  }, [visible, initialData, defaultDate]);

  const showSub = categoria === CATEGORY_WITH_SUBCATS;

  const save = async () => {
    const n = Math.abs(parseFloat(importeAbs) || 0);
    const docData = {
      ...(initialData || {}),
      fecha, categoria,
      subcategoria: showSub ? (subcategoria || null) : null,
      concepto,
      importe: tipo === 'Gasto' ? -n : n,
      tipo, cuenta,
    };
    if (editing) await updateFin(docData); else await addFin(docData);
    onClose();
  };

  const Chips = ({ options, value, onChange }) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
      {options.map(o => (
        <TouchableOpacity key={o} onPress={() => onChange(o)}
          style={[styles.chip, value === o && styles.chipActive]}>
          <Text style={[styles.chipText, value === o && styles.chipTextActive]}>{o}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing ? 'Editar apunte' : 'Nuevo apunte'}</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color="#6E6E73" /></TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={fecha} onChangeText={setFecha} placeholder="2026-01-01" />
            <Text style={styles.label}>Tipo</Text>
            <Chips options={['Gasto', 'Ingreso']} value={tipo} onChange={setTipo} />
            <Text style={styles.label}>Importe (€)</Text>
            <TextInput style={styles.input} value={importeAbs} onChangeText={setImporteAbs}
              keyboardType="numeric" placeholder="0.00" />
            <Text style={styles.label}>Categoría</Text>
            <Chips options={CATEGORIES} value={categoria} onChange={setCategoria} />
            {showSub && (<>
              <Text style={styles.label}>Subcategoría</Text>
              <Chips options={SUBCATEGORIES} value={subcategoria} onChange={setSubcategoria} />
            </>)}
            <Text style={styles.label}>Cuenta</Text>
            <Chips options={CUENTAS} value={cuenta} onChange={setCuenta} />
            <Text style={styles.label}>Concepto</Text>
            <TextInput style={styles.input} value={concepto} onChangeText={setConcepto} />
            <TouchableOpacity style={styles.saveBtn} onPress={save}>
              <Text style={styles.saveText}>{editing ? 'Guardar' : 'Añadir'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F7' },
  tabs: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  tabBtn: { backgroundColor: '#EBEBED', paddingVertical: 7, paddingHorizontal: 16, borderRadius: 8 },
  tabActive: { backgroundColor: BRAND.blue },
  tabText: { color: '#6E6E73', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  year: { marginLeft: 'auto', color: '#6E6E73', fontWeight: '600' },
  monthbar: { paddingHorizontal: 8, maxHeight: 44 },
  pill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, marginRight: 4 },
  pillActive: { backgroundColor: BRAND.blue },
  pillText: { color: '#6E6E73', fontSize: 13 },
  pillTextActive: { color: '#fff' },
  cards: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginVertical: 8 },
  card: { flex: 1, borderRadius: 14, padding: 12 },
  cardLabel: { fontSize: 11, textTransform: 'uppercase' },
  cardValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  search: { marginHorizontal: 12, marginBottom: 8, backgroundColor: '#fff', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E5E5EA' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12,
    marginBottom: 8, padding: 12, borderRadius: 12 },
  concept: { fontSize: 15, fontWeight: '500', color: '#1D1D1F' },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 12 },
  metaText: { color: '#6E6E73', fontSize: 12 },
  empty: { textAlign: 'center', color: '#AEAEB2', fontStyle: 'italic', marginTop: 30 },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: BRAND.blue, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  // Tabla anual
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  thead: { backgroundColor: '#FAFAFA' },
  th: { width: 52, padding: 6, fontSize: 10, color: '#6E6E73', textAlign: 'right', textTransform: 'uppercase' },
  td: { width: 52, padding: 6, fontSize: 11, textAlign: 'right', color: '#1D1D1F' },
  catCol: { width: 120, textAlign: 'left' },
  subRow: { backgroundColor: '#FCFCFD' },
  subText: { color: '#6E6E73' },
  totalRow: { backgroundColor: '#FAFAFA', borderTopWidth: 2, borderTopColor: '#E5E5EA' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18,
    padding: 18, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1D1D1F' },
  label: { fontSize: 12, color: '#6E6E73', marginBottom: 4, marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#D2D2D7', borderRadius: 8, padding: 10, backgroundColor: '#FAFAFA',
    color: '#1D1D1F', marginBottom: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#EBEBED', marginRight: 6 },
  chipActive: { backgroundColor: BRAND.blue },
  chipText: { color: '#6E6E73', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: BRAND.blue, borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 12, marginBottom: 20 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
```

- [ ] **Step 2: Verificar sintaxis/bundle**

Run:
```bash
cd mobile && npx expo export --platform web --output-dir /tmp/expo_finanzas_check2 2>&1 | tail -20; cd ..
```
Expected: export sin errores de sintaxis/import. (Fallback igual que Task 14 Step 3 si `expo export` no está disponible.)

- [ ] **Step 3: Commit**

```bash
git add mobile/src/screens/FinanzasScreen.js
git commit -m "feat(finanzas): pantalla Finanzas con Mensual, Anual y form (móvil)"
```

---

### Task 16: Tab "Finanzas" en la navegación móvil

**Files:**
- Modify: `mobile/src/navigation/MainNavigator.js`

- [ ] **Step 1: Importar el icono y la pantalla**

En `mobile/src/navigation/MainNavigator.js`, añade `Wallet` al import de iconos (línea 3):
```js
import { Home, List, Settings, TrendingUp, BarChart2, Wallet } from 'lucide-react-native';
```
Y añade el import de la pantalla tras los demás:
```js
import FinanzasScreen from '../screens/FinanzasScreen';
```

- [ ] **Step 2: Añadir la `Tab.Screen`**

Dentro del `<Tab.Navigator>`, añade tras la `Tab.Screen` de "Avance":
```jsx
            <Tab.Screen
                name="Finanzas"
                component={FinanzasScreen}
                options={{
                    tabBarIcon: ({ color }) => <Wallet color={color} size={24} />,
                    tabBarLabel: 'Finanzas'
                }}
            />
```

- [ ] **Step 3: Verificar bundle**

Run:
```bash
cd mobile && npx expo export --platform web --output-dir /tmp/expo_finanzas_check3 2>&1 | tail -20; cd ..
```
Expected: export sin errores.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/navigation/MainNavigator.js
git commit -m "feat(finanzas): tab Finanzas en la navegación móvil"
```

---

## Phase 6 — Verificación final y cierre

### Task 17: Verificación end-to-end y limpieza

**Files:** (ninguno nuevo)

- [ ] **Step 1: Tests verdes**

Run: `npm test`
Expected: todos los tests de `src/finanzas/summary.test.js` en verde.

- [ ] **Step 2: Build web OK**

Run: `npm run build`
Expected: build sin errores.

- [ ] **Step 3: Recuento en Firestore coincide con el balance de la app**

Run:
```bash
node -e "import('./scripts/finanzas/firestoreRest.mjs').then(async m => console.log('finTransactions =', await m.countDocs('finTransactions')))"
```
Expected: el recuento coincide con el observado en la Task 6 (547 o nº de ids únicos).
Verificación de negocio en la app (web, vista Anual): la **fila TOTAL → Total** del año debe cuadrar con la suma de balances mensuales de enero a mayo 2026 (incluye el par "Ingreso Deuda" +41.700 / "Casa SE" −41.700, que NO se excluye).

- [ ] **Step 4: Confirmar aislamiento de datos**

Verificar manualmente que las pestañas de empresa (Inicio/Movimientos/Estadísticas/Avance) no muestran ningún apunte de finanzas personales, y que Finanzas no muestra `transactions` de empresa. Son colecciones y contextos distintos.

- [ ] **Step 5: Commit de cierre (si quedaran cambios sin commitear)**

```bash
git status
# si hay cambios pendientes:
git add -A && git commit -m "chore(finanzas): verificación final"
```

---

## Notas de ejecución

- **Migración (Task 6) escribe en Firestore de producción.** Es idempotente (doc id = id original), así que re-ejecutar no duplica. No hay datos previos de `finTransactions` que perder.
- El script usa la credencial del owner ya logada en el CLI de Firebase; si caducara, `npx firebase login` la renueva.
- Web y móvil comparten `constants.js` y `summary.js` por **copia literal** (patrón del repo). Si se modifica la lógica, actualizar ambas copias y re-correr `npm test` (el test vive en web).
- No tocar `server.js` ni `prisma/` (legacy, no usados por la app desplegada).
