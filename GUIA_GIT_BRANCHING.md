# Guía de Trabajo con Ramas (Branches) en Git y GitHub

Trabajar con ramas es fundamental para mantener tu código organizado y seguro. Te permite desarrollar nuevas funcionalidades o arreglar errores sin afectar a la versión principal (y estable) de tu proyecto hasta que todo esté listo.

## 1. ¿Qué es una rama?
Imagina que tu proyecto es un árbol. 
- **main (o master):** Es el tronco. Aquí siempre debe estar el código que funciona perfectamente (versión de producción).
- **Ramas (branches):** Son bifurcaciones que salen del tronco. Aquí haces experimentos, añades botones, arreglas fallos... Si algo sale mal, el tronco sigue intacto.

## 2. Flujo de Trabajo Básico

### Paso 1: Crear una rama nueva
Antes de empezar cualquier tarea nueva (ej: "añadir modo oscuro"), crea una rama. Nunca trabajes directamente en `main` si puedes evitarlo.

```bash
# Asegúrate de estar en main y tener todo actualizado
git checkout main
git pull origin main

# Crea la rama y cámbiate a ella automáticamente (-b de branch)
# Nombra tus ramas explicando qué hacen: feature/nueva-cosa, fix/error-login
git checkout -b feature/modo-oscuro
```

### Paso 2: Trabajar en tu rama
Ahora estás en tu "mundo paralelo". Puedes borrar archivos, romper cosas... `main` no se enterará.

Haz tus cambios y guárdalos (commits) como siempre:
```bash
git add .
git commit -m "feat: colores oscuros añadidos"
```

### Paso 3: Subir la rama a GitHub
Tu rama solo existe en tu ordenador. Para guardarla en la nube:

```bash
# La primera vez que subes una rama nueva
git push -u origin feature/modo-oscuro
```

### Paso 4: Unir los cambios (Merge vs Pull Request)

**Opción A: Vía GitHub (Recomendada para equipos)**
1. Ve a tu repositorio en GitHub.com.
2. Verás un aviso: "feature/modo-oscuro had recent pushes". Haz clic en **"Compare & pull request"**.
3. Revisa los cambios y dale a **"Merge pull request"**.
4. Esto fusiona tu rama con `main` de forma segura y visual.

**Opción B: Vía Consola (Local)**
Si estás solo y quieres hacerlo rápido en tu PC:
```bash
# 1. Vuelve al tronco principal
git checkout main

# 2. Trae los cambios de tu rama
git merge feature/modo-oscuro

# 3. Sube el main actualizado a la nube
git push origin main
```

### Paso 5: Limpieza
Una vez fusionada, esa rama ya no sirve. Bórrala para no acumular basura.

```bash
# Borrar rama local
git branch -d feature/modo-oscuro

# Borrar rama remota (si ya hiciste merge en GitHub)
git push origin --delete feature/modo-oscuro
```

## Resumen de Comandos Útiles

| Acción | Comando |
| :--- | :--- |
| **Ver ramas** | `git branch` (la que tiene * es la actual) |
| **Crear y cambiar** | `git checkout -b <nombre-rama>` |
| **Cambiar de rama** | `git checkout <nombre-rama>` |
| **Borrar rama** | `git branch -d <nombre-rama>` |
| **Ver estado** | `git status` |

## Buenas Prácticas
1. **Ramas pequeñas:** Intenta que cada rama resuelva una sola cosa (ej: no arregles el login y cambies el diseño del footer en la misma rama).
2. **Nombres descriptivos:** Usa prefijos como `feat/` (nueva función), `fix/` (parche), `chore/` (mantenimiento).
3. **Mantén main limpio:** Nunca hagas `force push` a main. `main` es sagrado.
