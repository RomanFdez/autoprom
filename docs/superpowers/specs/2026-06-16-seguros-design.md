# Sección "Seguros" — Diseño

Fecha: 2026-06-16
Estado: aprobado el diseño funcional; pendiente revisión del spec.

## Objetivo

Añadir una sección **Seguros** a la aplicación (web y móvil) que sirva como
**registro familiar de seguros**: dar de alta, consultar, editar y borrar
seguros, de forma que cualquier persona de la casa con acceso a la app pueda ver
qué seguros existen y, en caso de necesidad, a quién llamar y qué tiene cubierto.

Incluye una pantalla de **estadísticas** con el coste mensual/anual y el número
de seguros (total y por tipo).

## Enfoque técnico

Se replica el patrón de la sección **Finanzas** (la más reciente y limpia del
repo): **Firebase Firestore** como almacén, con una colección nueva `seguros`.

- Compartido en tiempo real entre todos los miembros de la casa, igual que
  Finanzas.
- No toca `server.js` ni Prisma (eso es solo para P.S.Espada).
- El mismo contexto y la misma lógica de cálculo se reutilizan en web y móvil.

Descartado: backend Prisma/servidor (más trabajo, SQLite local, peor para uso
multi-dispositivo).

## Modelo de datos

Colección Firestore `seguros`. Cada documento:

| Campo            | Tipo               | Notas |
|------------------|--------------------|-------|
| `id`             | string (uuid)      | Igual que `finTransactions`. |
| `tipo`           | enum               | `salud`, `vida`, `coche`, `construccion`, `hogar`, `otro`. Desplegable. |
| `numeroPoliza`   | string             | Texto libre. |
| `compania`       | string             | Texto libre (Sanitas, Sabadell, Cajamar, AMA, Asefa…). |
| `tomador`        | string             | Quién contrata el seguro. |
| `asegurado`      | string (libre)     | Quién o qué está asegurado: persona, nombre del coche, nombre de la casa. También se usa para anotar beneficiarios si aplica. |
| `telefono`       | string             | Teléfono de contacto de la compañía / asistencia / siniestros. |
| `importe`        | number (€)         | Lo que se cobra por periodo. |
| `periodicidad`   | enum               | `mensual`, `bimensual`, `trimestral`, `anual`, `bianual`. Ver semántica abajo. |
| `fechaEfecto`    | string `YYYY-MM-DD`| Fecha de efecto / inicio. |
| `fechaVencimiento`| string `YYYY-MM-DD` (opcional) | Vigencia / renovación. |
| `estado`         | enum               | `activa` | `cancelada`. Por defecto `activa`. |
| `coberturas`     | string (texto largo)| Nota libre grande (textarea); copiar/pegar coberturas. |
| `importeMensual` | number (€)         | **Calculado, solo lectura.** Persistido para facilitar las stats. |

### Semántica de periodicidad y cálculo del importe mensual

`importeMensual = importe / mesesDelPeriodo`, donde:

| periodicidad | meses del periodo | importeMensual |
|--------------|-------------------|----------------|
| `mensual`    | 1   | `importe / 1`  |
| `bimensual`  | 2   | `importe / 2`  (cada 2 meses) |
| `trimestral` | 3   | `importe / 3`  |
| `anual`      | 12  | `importe / 12` |
| `bianual`    | 24  | `importe / 24` (cada 2 años) |

- `bianual` = una vez cada 2 años (24 meses).
- `bimensual` = una vez cada 2 meses.

El cálculo vive en una función pura y testeable, al estilo de
`src/finanzas/summary.js`.

## Arquitectura

### Web (React + Vite)

Nuevos ficheros, siguiendo el patrón de Finanzas:

- `src/context/SegurosContext.jsx` — provider sobre la colección `seguros` de
  Firestore (`onSnapshot`, `addSeguro`, `updateSeguro`, `removeSeguro`),
  calcado de `FinanzasContext.jsx`.
- `src/seguros/constants.js` — enums (`TIPOS`, `PERIODICIDADES`, etiquetas y
  colores por tipo), helpers de formato.
- `src/seguros/calc.js` — funciones puras: `importeMensual(importe, periodicidad)`
  y `getEstadisticas(seguros)` (totales, conteo por tipo, próximas renovaciones).
- `src/seguros/calc.test.js` — tests de las funciones puras (Vitest, como
  `summary.test.js`).
- `src/components/SeguroForm.jsx` — formulario alta/edición (modal), con el
  importe mensual mostrado en vivo y de solo lectura.
- `src/pages/Seguros.jsx` — página con dos sub-pestañas: **Listado** y
  **Estadísticas**.

Cambios en ficheros existentes:

- `src/App.jsx` — `lazy` import de `Seguros` y ruta
  `/seguros` envuelta en `<SegurosProvider>` (igual que `/finanzas`).
- `src/components/Layout.jsx` — nuevo enlace de navegación **Seguros** en
  **posición 2**, entre *Finanzas* y el grupo *P.S.Espada*. Icono `ShieldCheck`
  de `lucide-react`.

### Móvil (React Native / Expo)

- `mobile/src/context/SegurosContext.js` — equivalente al de web.
- `mobile/src/screens/SegurosScreen.js` — pantalla con Listado + Estadísticas.
- `mobile/src/seguros/constants.js` y `mobile/src/seguros/calc.js` — copia del
  patrón existente en `mobile/src/finanzas/` (cada app mantiene su propia copia).
- `mobile/src/navigation/MainNavigator.js` — nueva `Tab.Screen` **Seguros** en
  posición 2, con icono `ShieldCheck` de `lucide-react-native`, envuelta junto a
  los demás providers.

## Pantallas

### Listado

- Lista de seguros (tarjetas o tabla compacta) mostrando: tipo (badge con
  color), compañía, asegurado, nº de póliza, importe + periodicidad, importe
  mensual y teléfono.
- Filtro por **tipo** y por **estado** (activos / todos).
- Botón flotante ➕ (FAB) para alta (abre `SeguroForm`).
- Acciones por fila: editar y borrar. El borrado pide confirmación incluyendo
  un identificador legible del seguro (p. ej. `"¿Eliminar el seguro de coche de
  Sanitas (póliza 12345)?"`), al estilo de Finanzas.
- Un seguro `cancelada` se muestra atenuado / archivado y no cuenta en stats.

### Estadísticas

Calculado solo sobre seguros **activos**:

- **Coste mensual total** = suma de `importeMensual`.
- **Coste anual total** = coste mensual × 12.
- **Número de seguros** (activos).
- **Desglose por tipo**: cuántos seguros y coste mensual por cada tipo.
- **Próximas renovaciones**: lista de seguros con `fechaVencimiento` próxima
  (ordenados por fecha), aprovechando ese campo.

## Errores y casos límite

- `importe` vacío o no numérico → `importeMensual` = 0; el formulario valida que
  sea un número ≥ 0.
- `fechaVencimiento` es opcional; si falta, el seguro no aparece en "próximas
  renovaciones".
- Sin seguros → listas vacías con mensaje "Sin seguros" y stats a 0.
- `tipo` desconocido (datos antiguos) → se trata como `otro` para color/etiqueta.

## Pruebas

- Tests unitarios de `seguros/calc.js`:
  - `importeMensual` para las 5 periodicidades.
  - `getEstadisticas`: totales, conteo por tipo, exclusión de cancelados,
    orden de próximas renovaciones.
- Verificación manual en el navegador (preview): alta, edición, borrado,
  filtros, cambio de estado y pantalla de estadísticas.

## Fuera de alcance (YAGNI)

- Mediador/agente como campos propios.
- Adjuntar/subir el PDF de la póliza.
- Recordatorios push de renovación (solo se muestra la lista en pantalla).
- Inventario de bienes o capital asegurado detallado (cabe en `coberturas`).
