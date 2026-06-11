# Diseño: sección "Finanzas" (finanzas personales) en autoprom

Fecha: 2026-06-11
Estado: aprobado (brainstorming) — pendiente plan de implementación

## Objetivo

Añadir un nuevo apartado **"Finanzas"** (item de menú) a la app autoprom
(`sierra-espada-30`), replicando la app de finanzas personales que hoy corre en
local (FastAPI + SQLite + HTML estático en `~/workspaces/finanzas_personales`).

Migrar los **547 apuntes** existentes (enero–mayo 2026) exportados en
`~/workspaces/finanzas_personales/docs/finanzas_export.json`.

## Contexto crítico y hallazgo de arquitectura

autoprom **ya es una app de finanzas** (contabilidad de empresa/proyecto Sierra
Espada): modelos `Transaction`, `Category`, `Tag` y páginas Inicio / Estadísticas
/ Movimientos / Avance / Admin.

Las **finanzas personales son datos DISTINTOS e independientes** y NO deben
mezclarse: otras categorías, cuentas bancarias propias, subcategorías, campo `tipo`.

**Hallazgo que corrige el handoff:** el handoff describe el backend como
"React + Express + Prisma". En realidad la app desplegada **ya no usa Express+Prisma
para los datos**:

- `src/context/DataContext.jsx` lee/escribe **directamente contra Firebase
  Firestore** (`onSnapshot`, `setDoc`, `deleteDoc`, `writeBatch`) sobre colecciones
  `transactions`, `categories`, `tags`, `certificaciones`, `settings`.
- `firebase.json` despliega `dist` en Firebase Hosting; `src/firebaseConfig.js`
  apunta al proyecto `autoprom-84fe0`.
- `server.js` (Express + Prisma + SQLite) es **legacy** anterior a la migración a
  Firebase y el frontend desplegado ya no lo usa.
- Existe una segunda app **móvil** en `mobile/` (Expo / React Native) que comparte
  el mismo proyecto Firestore, con su propio `DataContext`, navegación
  (`@react-navigation/bottom-tabs`) y pantallas, en paralelo a la web.

**Consecuencia:** NO se replicará la API FastAPI con endpoints Express/Prisma. Las
finanzas personales se implementan sobre **Firestore** (igual que el resto de la
app real), con la lógica de resumen/previsión portada a **JavaScript en cliente**.

## Decisiones aprobadas

1. **Backend de datos:** Firestore (colecciones propias), descartado Express+Prisma.
2. **Catálogos** (categorías, subcategorías, cuentas): **fijos en código** como en
   `main.py` (no editables desde UI).
3. **Migración:** **importar desde la UI** (botón que sube el JSON a Firestore;
   patrón existente `importData` con `writeBatch`). Re-ejecutable.
4. **Alcance:** **web (`src/`) + móvil (`mobile/`)**.
5. **Navegación:** un único item de menú **"Finanzas"** con dos sub-vistas internas
   (**Mensual** / **Anual**), en vez de dos items separados.
6. **Aislamiento de código:** **`FinanzasContext` separado** del `DataContext` de
   empresa, en ambas apps.
7. **doc id = id entero original** (como string) para que reimportar el JSON
   sobreescriba en vez de duplicar (import idempotente). Apuntes nuevos creados en
   la app usan `uuid`.
8. **Lógica de previsión** (`finanzasSummary.js`) desarrollada con **TDD**; el resto
   de la UI portada del `index.html` de referencia.

## Modelo de datos (Firestore)

Colección nueva **`finTransactions`**. Documento:

```jsonc
{
  "id": "23",                 // string; = id entero original al migrar, uuid si es nuevo
  "fecha": "2026-01-02",      // YYYY-MM-DD
  "categoria": "Seguros",     // una de las 16 categorías
  "subcategoria": null,       // string sólo si categoria == "Compras varias", si no null
  "concepto": "Recibo SANITAS S A DE SEGUROS",
  "importe": -49.61,          // negativo = gasto, positivo = ingreso
  "tipo": "Gasto",            // "Gasto" | "Ingreso"
  "cuenta": "ING"             // ING | IberiaCard | Sabadell | Cajamar
}
```

No se crea colección de categorías/cuentas: son constantes en código.

## Constantes (módulo `finanzas/constants.js`, duplicado web/móvil)

```js
export const CATEGORIES = [
  "Casa JF", "Casa Madrid", "Casa SE", "Comida/Super", "Comisiones",
  "Compras varias", "Devolución", "Facturas", "Gasolina y Transporte",
  "Impuestos", "Ingreso Deuda", "Niños", "Nomina", "Ocio", "Seguros",
  "Subscripciones",
];

export const SUBCATEGORIES = [ // sólo aplican a "Compras varias"
  "Amazon", "Cafetería / Bar", "Compras Niños", "Delivery", "El Corte Inglés",
  "Farmacia", "Hogar", "Kiosco / Pequeñas compras", "Libros y Cultura",
  "Liquidación tarjeta Cajamar", "Mercado / Alimentación", "Ocio / Juegos",
  "Otros (revisar)", "Perfumería / Belleza", "Ropa y Calzado",
  "Tecnología / Dominios", "Wallapop (segunda mano)",
];

export const CUENTAS = ["ING", "IberiaCard", "Sabadell", "Cajamar"];

export const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// formato "background:foreground" (tomado del index.html de referencia)
export const CAT_COLORS = {
  "Casa JF":               "#DBEAFE:#1D4ED8",
  "Casa Madrid":           "#DBEAFE:#1D4ED8",
  "Casa SE":               "#DBEAFE:#1D4ED8",
  "Comida/Super":          "#FEF3C7:#92400E",
  "Comisiones":            "#F3F4F6:#374151",
  "Compras varias":        "#EDE9FE:#5B21B6",
  "Devolución":            "#CCFBF1:#0F766E",
  "Facturas":              "#FEF9C3:#854D0E",
  "Gasolina y Transporte": "#FFEDD5:#9A3412",
  "Impuestos":             "#FEE2E2:#991B1B",
  "Ingreso Deuda":         "#D1FAE5:#065F46",
  "Niños":                 "#FCE7F3:#9D174D",
  "Nomina":                "#DCFCE7:#166534",
  "Ocio":                  "#F3E8FF:#6B21A8",
  "Seguros":               "#E2E8F0:#334155",
  "Subscripciones":        "#CFFAFE:#155E75",
};
// fallback: "#F3F4F6:#374151"

// Colores de marca
// Azul corporativo #0055B3; verde ingresos #1A7F37 / #166534;
// rojo gastos #C0392B / #991B1B.
```

## Lógica de resumen y previsión (`finanzasSummary.js`, puerto de `main.py`)

Funciones puras (sin dependencias de red ni Firestore), reciben el array de apuntes:

### `getSummary(transactions, year)`
Replica `GET /api/summary`:
- Filtra apuntes del `year`.
- Pivote `categoria → mes(1..12) → suma(importe)`.
- `cur_month` = mes actual si `today.year == year`; 12 si el año ya pasó; 0 si es futuro.
- `actual_months` = meses con datos cuyo número ≤ `cur_month`, ordenados. `n = len`.
- `remaining = 12 - n`.
- Por categoría (orden alfabético): para cada mes, valor redondeado si está en
  `actual_months`, si no `null` (renderiza "—"). `total_actual` = suma de meses con
  datos. `media_mensual = total/n` (0 si n=0).
  **`prevision = total + media * remaining`.**
- Fila TOTAL: suma de todas las categorías por mes (sin exclusiones — debe cuadrar
  con el balance de cada vista mensual), con su propia media y previsión.
- Devuelve `{ rows, total_row, actual_months, cats_with_subcats }`.
- `cats_with_subcats` = categorías del año que tienen ≥1 apunte con `subcategoria != null`.

### `getBreakdown(transactions, year, categoria)`
Replica `GET /api/summary/breakdown`:
- Igual que summary pero pivotando por `subcategoria` (o `"(sin subcategoría)"` si
  null) dentro de una categoría. Devuelve `{ rows, actual_months }`.

Todos los importes redondeados a 2 decimales en la salida.

## Arquitectura por app (web `src/` y móvil `mobile/src/`)

Se sigue el patrón de **duplicación** que ya tiene la app (DataContext, icons,
screens duplicados entre web y móvil). No se introduce paquete compartido.

Por cada app:

- **`FinanzasContext`** — provider nuevo, montado junto al `DataProvider`
  existente (no se modifica el DataContext de empresa). Listener `onSnapshot` a
  `finTransactions` + CRUD:
  - `addFin(t)` → `setDoc(doc(db,'finTransactions', uuid))`
  - `updateFin(t)` → `setDoc(..., t.id, t, {merge:true})`
  - `removeFin(id)` → `deleteDoc`
  - `bulkImportFin(array)` → `writeBatch` en chunks de 450, doc id = id original.
- **`finanzasSummary.js`** — lógica pura descrita arriba (con tests).
- **`finanzas/constants.js`** — constantes y colores.

## UI

### Navegación
- **Web:** nuevo `NavLink` "Finanzas" en `src/components/Layout.jsx` (icono
  `lucide-react`, p. ej. `Wallet`), ruta `/finanzas` en `src/App.jsx` (página
  lazy `Finanzas`). La página tiene dos sub-tabs internas: **Mensual** / **Anual**.
- **Móvil:** nueva `Tab.Screen` "Finanzas" en `mobile/src/navigation/MainNavigator.js`
  (icono `Wallet` de `lucide-react-native`), con sub-tabs internas equivalentes.

### Vista Mensual
- Selector de mes (Ene…Dic) y de año.
- 3 tarjetas de totales: **Ingresos** (verde #166534 sobre #F0FDF4), **Gastos**
  (rojo #991B1B sobre #FFF5F5), **Balance** (azul #1E40AF sobre #EFF6FF).
- Tabla de apuntes del mes: fecha, categoría (badge de color via `CAT_COLORS`),
  subcategoría, concepto, cuenta, importe, acciones (editar/borrar).
- Filtros: buscar por concepto, por cuenta, por categoría.
- Al filtrar por categoría: barra de totales filtrados (ingresos/gastos/balance,
  centrada).
- **Recategorizar rápido:** clic en el badge de categoría abre selector para
  cambiarla (update directo del apunte).
- Modal añadir/editar apunte (fondo blanco sólido). Campo subcategoría **sólo
  visible si categoría == "Compras varias"**.

### Vista Anual
- Tabla pivote categoría × mes (Ene…Dic). Meses sin datos = "—".
- Columnas finales: **Total real**, **Media/mes**, **Previsión**.
- Fila **TOTAL** al final (suma de todas las categorías, sin exclusiones).
- **Drill-down:** clic en una categoría incluida en `cats_with_subcats` despliega
  filas por subcategoría (vía `getBreakdown`). Triángulo sólo si tiene subcats.

## Migración de datos (import desde UI)

- Botón **"Importar JSON"** en la sección Finanzas.
- Lee el array `finanzas_export.json` (`{id, fecha, categoria, subcategoria,
  concepto, importe, tipo, cuenta}`).
- Mapea cada objeto a doc de `finTransactions` con **doc id = String(id original)**.
- Escribe con `writeBatch` en chunks de 450 (idempotente: reimportar sobreescribe).

## Notas de negocio

- "Ingreso Deuda" (41.700 € en enero) es la disposición de un préstamo; su
  contrapartida es un traspaso de salida de −41.700 € en "Casa SE" el mismo día.
  Ambos están en los datos: no se filtran ni excluyen.
- Flujo mensual futuro del usuario: exporta movimientos de cada banco (ING .xls,
  IberiaCard .xlsx, Sabadell .xls, Cajamar .xls) y los carga evitando duplicar.
  **IberiaCard exporta importes en positivo** → hay que invertirlos a gasto salvo
  devoluciones. (La importación de extractos bancarios queda **fuera del alcance de
  esta iteración**; sólo se migra el JSON exportado. Se documenta como nota para una
  fase posterior.)

## Fuera de alcance (esta iteración)

- Importación directa de extractos bancarios (.xls/.xlsx) y deduplicación automática.
- Catálogos editables desde la UI.
- Cualquier cambio a `server.js`/Prisma (legacy, no usado).

## Testing

- `finanzasSummary.js` (getSummary/getBreakdown/previsión) con tests unitarios:
  cuadre de la fila TOTAL con balances mensuales, cálculo de previsión, meses sin
  datos = null, `cats_with_subcats`, año pasado/actual/futuro.
- Verificación manual en navegador tras importar el JSON: totales del mes,
  pivote anual, drill-down, recategorizar.
