# Sección "Casa" — Pilas recargables — Diseño

Fecha: 2026-10-07
Estado: diseño funcional aprobado; pendiente revisión del spec.

## Objetivo

Añadir una cuarta sección **Casa** (web y móvil) pensada como almacén de datos
del hogar, al estilo de un ERP sencillo. El primer submódulo es **Pilas**:
saber **en qué aparato están puestas las pilas recargables**, cuántas y de qué
tipo, y cuántas quedan disponibles en el cajón.

No se busca detectar pilas perdidas: una pila o está **en uso** (puesta en un
aparato) o está **disponible** (en el cajón). No hay estado "cargando".

## Alcance

- Solo pilas **recargables**.
- Tipos fijos: `AA`, `AAA`, `BRC26650`.
- **Un único stock por tipo**, con capacidad (mAh) como dato del tipo. Sin marca.
- Aparato y estancia como **texto libre**, con sugerencias de lo ya escrito
  (no hay catálogo de aparatos que mantener).
- Historial de movimientos.
- Compartido entre toda la familia, igual que Finanzas y Seguros.
- Web y móvil.

Fuera de alcance: cargador como ubicación, pilas individuales numeradas,
pilas desechables, avisos o bloqueos por falta de stock, integración con
Home Assistant.

## Modelo de datos (Firestore)

### `pilasTipos`

Un documento por tipo; el id del documento es el propio tipo.

| Campo          | Tipo              | Notas |
|----------------|-------------------|-------|
| `tipo`         | enum              | `AA`, `AAA`, `BRC26650`. |
| `capacidadMah` | number (opcional) | Informativo, p. ej. `2500`. |
| `total`        | number            | Pilas que hay en casa de ese tipo. |

Si un tipo no tiene documento todavía, se trata como `total = 0` y sin
capacidad; se crea al editarlo por primera vez.

### `pilasAsignaciones`

Lo que está puesto ahora mismo. Un documento por aparato y tipo.

| Campo             | Tipo                | Notas |
|-------------------|---------------------|-------|
| `id`              | string (uuid)       | |
| `aparato`         | string              | Obligatorio. "Mando TV". |
| `estancia`        | string (opcional)   | "Salón". |
| `tipo`            | enum                | `AA`, `AAA`, `BRC26650`. |
| `cantidad`        | number (entero ≥ 1) | |
| `fechaColocacion` | string `YYYY-MM-DD` | Por defecto, hoy. |

### `pilasMovimientos`

Historial; en él solo se añaden registros, nunca se editan ni se borran.

| Campo      | Tipo                 | Notas |
|------------|----------------------|-------|
| `id`       | string (uuid)        | |
| `fecha`    | string ISO datetime  | Momento del movimiento. |
| `usuario`  | string               | `displayName` o email del usuario autenticado. |
| `accion`   | enum                 | `poner`, `quitar`, `editar`, `ajusteTotal`. |
| `aparato`  | string (opcional)    | No aplica en `ajusteTotal`. |
| `estancia` | string (opcional)    | |
| `tipo`     | enum                 | |
| `cantidad` | number               | En `ajusteTotal`, el nuevo total. |
| `detalle`  | string (opcional)    | Texto legible para `editar`/`ajusteTotal` (p. ej. "4 → 2", "total 10 → 12"). |

### Valores derivados (no se guardan)

Por tipo:

- `enUso` = suma de `cantidad` de las asignaciones de ese tipo.
- `disponibles` = `total − enUso`.

Nunca se bloquea una asignación. Si `disponibles < 0` se muestra en rojo como
señal de que el `total` está mal.

## Comportamiento

- **Poner pilas**: crea una asignación y un movimiento `poner`.
- **Quitar**: borra la asignación entera (las pilas vuelven a disponibles) y
  registra `quitar` con la cantidad que tenía.
- **Editar**: cambia aparato, estancia, tipo, cantidad o fecha; registra
  `editar` con un `detalle` de lo cambiado. Para quitar solo algunas pilas se
  edita la cantidad.
- **Ajustar tipo**: cambia `total` y/o `capacidadMah`; si cambia el total,
  registra `ajusteTotal`.
- Cada acción escribe asignación/tipo y movimiento en un único `writeBatch`
  (o se guardan los dos o ninguno).

### Sugerencias

Al escribir aparato o estancia se sugieren valores ya usados, tomados de las
asignaciones actuales y del historial. Se eliminan duplicados ignorando
mayúsculas, minúsculas y espacios en los extremos, y se conserva la grafía más
reciente.

### Antigüedad

Cada asignación muestra el tiempo desde `fechaColocacion`: "hoy", "hace N días"
(< 30 días), "hace N meses" (< 12 meses), "hace N años".

## Pantallas

### Home (web)

Se añade un cuarto nodo **Casa** al anillo. Los cuatro nodos pasan del
triángulo a las cuatro diagonales del anillo, para que las etiquetas queden
fuera del círculo (encima en los de arriba, debajo en los de abajo).

### Navegación (web)

Sustituye a los desplegables de la barra superior:

- **Barra**: botón ☰ a la izquierda, en el centro la sección y página actual
  ("Seguros · Listado") con el color de la sección, y el tema a la derecha.
- **Menú lateral** (☰): Inicio y cada sección con su icono, su color y sus páginas
  siempre visibles; la página actual va resaltada. Se cierra al tocar fuera, al
  elegir una página o con Esc.
- Secciones y páginas se definen en un único sitio, `src/navigation.js`, que
  usan la home, la barra y el menú.

### Casa

Página contenedora con una tarjeta por submódulo. De momento solo hay una:
**Pilas**. Ruta web `/casa`.

### Pilas (ruta web `/casa/pilas`)

1. **Resumen por tipo**: una tarjeta por tipo,
   `AA · 2500 mAh — 8 en uso · 4 disponibles / 12`. Al pulsarla se abre un
   formulario para editar `total` y `capacidadMah`.
2. **Buscador**: filtra asignaciones por aparato, estancia o tipo (sin
   distinguir mayúsculas ni tildes).
3. **Lista de asignaciones**: una fila estrecha por asignación, ordenadas por
   aparato: `2× AAA · Mando TV · [Salón] · hace 8 meses`, con la estancia como
   etiqueta y acciones **Editar** y **Quitar** (esta última pide confirmación).
4. **Botón "Poner pilas"**: formulario con aparato (obligatorio, con
   sugerencias), estancia (opcional, con sugerencias), tipo (desplegable),
   cantidad (entero ≥ 1) y fecha (por defecto, hoy).
5. **Pestaña Historial**: movimientos del más reciente al más antiguo, con
   fecha, usuario y descripción.

### Móvil (Expo)

Mismas pantallas y comportamiento. Se añade una pestaña **Casa** al
`MainNavigator`. Desde ella se entra a Pilas con un stack o con una vista
interna, siguiendo lo que resulte más sencillo con la navegación actual.

## Arquitectura

Mismo patrón que Seguros.

### Web

- `src/casa/constants.js`: `TIPOS_PILA` (`AA`, `AAA`, `BRC26650`) y
  etiquetas.
- `src/casa/pilas.js`: funciones puras:
  - `resumenPorTipo(tipos, asignaciones)` → `{ tipo, capacidadMah, total, enUso, disponibles }[]`
  - `sugerencias(valores)` → lista sin duplicados (ver Sugerencias).
  - `antiguedad(fechaColocacion, hoy)` → texto.
  - `ordenarPorAparato(asignaciones)` → lista ordenada por aparato.
  - `filtrar(asignaciones, texto)`.
  - `describirMovimiento(mov)` → texto para el historial.
- `src/casa/pilas.test.js`: tests de lo anterior (vitest).
- `src/context/PilasContext.jsx`: `onSnapshot` de las tres colecciones,
  y `ponerPilas`, `quitarAsignacion`, `editarAsignacion` y `ajustarTipo` con
  `writeBatch`.
- `src/pages/Casa.jsx`, `src/pages/Pilas.jsx` y los formularios necesarios en
  `src/components/`.
- `src/App.jsx`: rutas `/casa` y `/casa/pilas` con `PilasProvider`.
- `src/pages/Home.jsx`: cuarto nodo.

### Móvil

- `mobile/src/casa/constants.js` y `mobile/src/casa/pilas.js`: copia de los
  ficheros de la web (igual que `mobile/src/seguros/`).
- `mobile/src/context/PilasContext.js`.
- `mobile/src/screens/CasaScreen.js` y `mobile/src/screens/PilasScreen.js`.
- `mobile/src/navigation/MainNavigator.js`: pestaña Casa y `PilasProvider`.

### Firestore

`firestore.rules` ya permite leer y escribir cualquier colección a las cuentas
de la allowlist, así que no hacen falta reglas nuevas.

## Pruebas

- Unitarias (vitest) para todas las funciones de `src/casa/pilas.js`:
  resumen con y sin documento de tipo, disponibles negativos, sugerencias con
  duplicados por mayúsculas y espacios, cortes de antigüedad (0, 29, 30 días,
  11 y 12 meses), agrupación con y sin estancia, filtro sin tildes.
- Verificación manual en el navegador (web) de poner, editar, quitar, ajustar
  total e historial.
