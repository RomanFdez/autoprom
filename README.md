# Proyecto Sierra de la Espada 30

Gestión de finanzas familiares: gastos e ingresos, resumen anual por categorías,
seguros y avance de obra.

## Stack actual

- **Frontend web**: React + Vite (`src/`). Desplegado en **Firebase Hosting**.
- **Datos**: **Firestore** (tiempo real, con `onSnapshot`).
- **Autenticación**: **Firebase Auth** (Google y email/contraseña).
- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml`) — tests, build y
  deploy a Firebase Hosting en cada push a `main`.

## Desarrollo local

```bash
npm install
npm run dev        # frontend en http://localhost:5173
npm test           # tests (vitest)
npm run lint       # eslint
```

No hace falta backend propio: la app habla directamente con Firebase.

## Estructura del proyecto

- `src/` — Código fuente React (páginas, contextos, lógica de finanzas y seguros).
- `src/finanzas/` — Lógica pura de finanzas (resumen anual, constantes) con tests.
- `src/seguros/` — Lógica pura de seguros con tests.
- `scripts/finanzas/` — Carga mensual de apuntes clasificados a Firestore
  (`loadMonthly.mjs`). Los JSON de datos bancarios están gitignorados.
- `scripts/seguros/`, `scripts/restore*.js` — Utilidades de migración/restore.

## Legacy (no usado)

Estos ficheros pertenecen al despliegue antiguo (Express + Prisma + Docker en
Debian), anterior a la migración a Firebase. **No se usan** y se conservan solo
como referencia histórica:

- `server.js` — Antiguo servidor Express con API de datos.
- `prisma/`, `prisma.config.ts` — Antiguo ORM/BD.
- `Dockerfile`, `docker-compose.yml`, `DEPLOY_DEBIAN.md` — Antiguo despliegue.
- `initial_seed.json`, `data/` — Datos del sistema antiguo.
