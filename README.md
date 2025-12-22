# Proyecto Sierra de la Espada 30

Gestiona tus gastos e ingresos de forma sencilla.

## Características
- Registro de transacciones con importe, fecha, categoría, etiquetas, y descripción.
- Filtros por día, semana, mes, o todo.
- Gráficos y reportes con "drilldown" (click para ver detalles).
- Exportación e importación CSV compatible con Excel.
- Presupuesto inicial configurable.
- Persistencia de datos en servidor (Docker ready).

## Requisitos
- Node.js 18+
- Docker & Docker Compose (Opcional, recomendado para producción)

## Instalación y Desarrollo Local
1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Iniciar servidor backend (para persistencia):
   ```bash
   node server.js
   ```

3. Iniciar frontend (en otra terminal):
   ```bash
   npm run dev
   ```
   Accede a http://localhost:5173 (El frontend se conectará al backend en el puerto 3030).

## Despliegue con Docker
Para desplegar la aplicación con persistencia de datos:

1. Construir y levantar el contenedor:
   ```bash
   docker-compose up --build -d
   ```

2. Acceder a la aplicación:
   http://localhost:3030

Los datos se guardarán en la carpeta `./data` del host.

## Estructura del Proyecto
- `src/` - Código fuente React.
- `server.js` - Servidor Express para servir la app y API de datos.
- `data/` - Carpeta donde se guarda `db.json` (persistencia).
- `docker-compose.yml` - Configuración para despliegue.
