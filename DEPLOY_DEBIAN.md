# Guía de Despliegue en Servidor Debian (Docker)

Sigue estos pasos para descargar y publicar "Proyecto Sierra de la Espada 30" en tu servidor Debian.

## 1. Prerrequisitos

Asegúrate de que tu servidor esté actualizado y tenga Git y Docker instalados.

1.  **Actualizar el sistema:**
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

2.  **Instalar Git y Curl:**
    ```bash
    sudo apt install git curl -y
    ```

3.  **Instalar Docker:**
    ```bash
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    ```

4.  **Instalar Docker Compose:**
    (En versiones recientes de Docker, `docker compose` ya viene incluido como plugin. Si no, instálalo manualmente).
    ```bash
    sudo apt install docker-compose-plugin
    ```

## 2. Descargar el Proyecto

1.  **Clonar el repositorio:**
    Navega a la carpeta donde quieras instalar la aplicación (ej: `/opt`).
    ```bash
    cd /opt
    sudo git clone https://github.com/RomanFdez/autoprom.git
    ```

2.  **Entrar en el directorio:**
    ```bash
    cd autoprom
    ```

## 3. Despliegue

1.  **Construir y levantar el contenedor:**
    Ejecuta el siguiente comando para compilar la imagen y arrancarla en segundo plano.
    ```bash
    sudo docker compose up --build -d
    ```
    *(Nota: Si usas una versión antigua de docker-compose, el comando sería `sudo docker-compose up --build -d`)*

2.  **Verificar que está corriendo:**
    ```bash
    sudo docker compose ps
    ```
    Deberías ver el servicio `app` con estado `Up` y el puerto `3030` mapeado.

## 4. Acceso

La aplicación estará disponible en la IP de tu servidor en el puerto 3030.
*   **URL:** `http://<IP_DE_TU_SERVIDOR>:3030`

*(Asegúrate de que el firewall de tu servidor permita el tráfico en el puerto 3030).*

## 5. Datos y Persistencia

Todos los datos de transacciones se guardarán automáticamente en la carpeta:
`/opt/autoprom/data/db.json`

Gracias al volumen configurado en Docker, **los datos no se perderán** si reinicias el contenedor o el servidor.

## 6. Actualización Futura

Si haces cambios en el código y quieres actualizar el servidor:

```bash
cd /opt/autoprom
sudo git pull origin main
sudo docker compose up --build -d
```
Esto bajará el código nuevo, reconstruirá la imagen y reiniciará el servicio conservando tus datos.
