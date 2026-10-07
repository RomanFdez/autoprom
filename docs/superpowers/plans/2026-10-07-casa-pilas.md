# Casa — Pilas recargables — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir la sección "Casa" (web y móvil) con el submódulo "Pilas": asignaciones de pilas recargables a aparatos, stock por tipo e historial.

**Architecture:** Mismo patrón que Seguros: tres colecciones Firestore (`pilasTipos`, `pilasAsignaciones`, `pilasMovimientos`) leídas con `onSnapshot` en un contexto React; lógica pura y testeada en `src/casa/pilas.js` (copiada a `mobile/src/casa/`); las escrituras van en `writeBatch` (asignación/tipo + movimiento).

**Tech Stack:** React 19 + Vite, React Router 7, Firebase 12 (Firestore/Auth), vitest, Expo / React Native, lucide-react(-native).

Spec: `docs/superpowers/specs/2026-10-07-casa-pilas-design.md`.

---

## Mapa de ficheros

| Fichero | Responsabilidad |
|---|---|
| `src/casa/constants.js` | Tipos de pila y colecciones. |
| `src/casa/pilas.js` | Lógica pura (resumen, sugerencias, antigüedad, agrupación, filtro, textos de historial). |
| `src/casa/pilas.test.js` | Tests vitest de lo anterior. |
| `src/context/PilasContext.jsx` | Lectura en tiempo real y acciones con `writeBatch`. |
| `src/pages/Casa.jsx` | Página contenedora de submódulos. |
| `src/pages/Pilas.jsx` | Resumen, buscador, lista agrupada, historial. |
| `src/components/PilaAsignacionForm.jsx` | Modal poner/editar. |
| `src/components/PilaTipoForm.jsx` | Modal de total y capacidad. |
| `src/App.jsx`, `src/components/Layout.jsx`, `src/pages/Home.jsx` | Rutas, menú y cuarto nodo. |
| `mobile/src/casa/{constants,pilas}.js` | Copia de la lógica web. |
| `mobile/src/context/PilasContext.js` | Contexto móvil. |
| `mobile/src/screens/CasaScreen.js`, `mobile/src/screens/PilasScreen.js` | Pantallas móviles. |
| `mobile/src/navigation/MainNavigator.js` | Pestaña Casa. |

---

### Task 1: Constantes y lógica pura (TDD)

**Files:**
- Create: `src/casa/constants.js`, `src/casa/pilas.js`
- Test: `src/casa/pilas.test.js`

- [ ] **Step 1: Constantes**

```js
// src/casa/constants.js
export const TIPOS_PILA = ['AA', 'AAA', 'BRC26650'];

export const COL_TIPOS = 'pilasTipos';
export const COL_ASIGNACIONES = 'pilasAsignaciones';
export const COL_MOVIMIENTOS = 'pilasMovimientos';

export const SIN_ESTANCIA = 'Sin estancia';

export const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
```

- [ ] **Step 2: Tests que fallan** (`src/casa/pilas.test.js`)

Casos:
- `resumenPorTipo`: devuelve los 3 tipos en orden; sin documento → total 0, capacidad null; suma `enUso`; `disponibles` negativos permitidos.
- `sugerenciasDe`: deduplica sin distinguir mayúsculas ni espacios en los extremos; conserva la grafía más reciente (por `fechaColocacion` / `fecha`); ignora vacíos; resultado ordenado alfabéticamente.
- `antiguedad`: 0 días → "hoy"; 1 → "hace 1 día"; 29 → "hace 29 días"; 30 días → "hace 1 mes"; 11 meses → "hace 11 meses"; 12 meses → "hace 1 año"; 30 meses → "hace 2 años".
- `agruparPorEstancia`: agrupa sin distinguir mayúsculas; grupos ordenados por nombre y "Sin estancia" al final; dentro, ordenadas por aparato.
- `filtrar`: texto vacío devuelve todo; busca en aparato, estancia y tipo sin tildes ni mayúsculas.
- `detalleEdicion`: lista los campos cambiados ("cantidad 4 → 2"); cadena vacía si no cambia nada.
- `describirMovimiento`: un texto por acción.

- [ ] **Step 3: Ejecutar** `npx vitest run src/casa` → FAIL (módulo no existe).

- [ ] **Step 4: Implementar `src/casa/pilas.js`** con las funciones `normalizar`, `resumenPorTipo(tipos, asignaciones)`, `sugerenciasDe(asignaciones, movimientos, campo)`, `antiguedad(fechaISO, hoy = new Date())`, `agruparPorEstancia(asignaciones)` → `[{ estancia, items }]`, `filtrar(asignaciones, texto)`, `detalleEdicion(antes, despues)` y `describirMovimiento(mov)`.

- [ ] **Step 5: Ejecutar** `npx vitest run src/casa` → PASS.

- [ ] **Step 6: Commit** `feat(casa): lógica pura de pilas con tests`.

### Task 2: PilasContext (web)

**Files:** Create `src/context/PilasContext.jsx`

- Tres `onSnapshot` (tipos, asignaciones, movimientos); `loading` hasta recibir los tres.
- Movimientos ordenados por `fecha` desc.
- `usuario = user?.displayName || user?.email || ''` (de `useAuth`).
- Acciones, cada una con un `writeBatch`:
  - `ponerPilas(datos)`: `set` asignación (uuid) + movimiento `poner`.
  - `editarAsignacion(antes, despues)`: `set` asignación + movimiento `editar` con `detalle = detalleEdicion(antes, despues)` (sin movimiento si el detalle está vacío).
  - `quitarAsignacion(a)`: `delete` asignación + movimiento `quitar`.
  - `ajustarTipo(tipo, { total, capacidadMah })`: `set` tipo con merge + movimiento `ajusteTotal` con `detalle` "total X → Y", solo si cambia el total.
- Campos `undefined` no se escriben (Firestore los rechaza): `estancia` se guarda como `''` si está vacía; `capacidadMah` como `null`.
- Commit: `feat(casa): contexto Firestore de pilas`.

### Task 3: Páginas web, rutas, menú y home

**Files:** Create `src/pages/Casa.jsx`, `src/pages/Pilas.jsx`, `src/components/PilaAsignacionForm.jsx`, `src/components/PilaTipoForm.jsx`; Modify `src/App.jsx`, `src/components/Layout.jsx`, `src/pages/Home.jsx`.

- Rutas: `casa` → `<Casa />`; `casa/pilas` → `<PilasProvider><Pilas /></PilasProvider>`.
- `Layout`: grupo "Casa" (icono `Sofa`) con una sola entrada, Pilas (`/casa/pilas`); el historial es una pestaña dentro de Pilas.
- `Home`: 4 nodos en las diagonales (Finanzas y Seguros arriba, Casa y P.S. Espada abajo); etiquetas fuera del anillo.
- `Pilas.jsx`: pestañas Asignaciones/Historial (`?v=historial`), tarjetas por tipo (clic → `PilaTipoForm`), buscador, grupos por estancia con filas `aparato — N× tipo — antigüedad`, editar/quitar (con `confirm`), FAB "Poner pilas".
- Formulario: aparato (obligatorio) y estancia con `<datalist>` de sugerencias; tipo (select); cantidad (`min=1`); fecha (por defecto hoy).
- Estilos con variables `--md-sys-color-*` y modo oscuro como en Seguros.
- Verificar: `npm run lint`, `npm test`, `npm run build`, y probar en el navegador con el preview `dev`.
- Commit: `feat(casa): sección Casa y pantalla de pilas en la web`.

### Task 4: Móvil

**Files:** Create `mobile/src/casa/constants.js`, `mobile/src/casa/pilas.js` (copias con cabecera `mobile/...`), `mobile/src/context/PilasContext.js`, `mobile/src/screens/CasaScreen.js`, `mobile/src/screens/PilasScreen.js`; Modify `mobile/src/navigation/MainNavigator.js`.

- Contexto calcado del web (con `import 'react-native-get-random-values'`).
- `CasaScreen`: tarjeta "Pilas"; al pulsar se muestra `PilasScreen` con botón Volver (estado interno).
- `PilasScreen`: mismas secciones; sugerencias como chips bajo el campo (máx. 6 que contengan el texto); `Alert.alert` para confirmar quitar; fecha como texto `YYYY-MM-DD`.
- Pestaña "Casa" (icono `Sofa`) tras Seguros; `PilasProvider` envolviendo el navegador.
- Comprobar sintaxis con `npx eslint` o `node --check` donde aplique (no hay tests móviles).
- Commit: `feat(casa): pilas en la app móvil`.
