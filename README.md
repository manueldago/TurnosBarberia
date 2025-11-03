# TurnosBarberia

Gestión de turnos para barbería.

Aplicación dividida en **backend** y **frontend** para administrar reservas y el flujo completo de trabajo.

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior
- [npm](https://www.npmjs.com/)

## Instalación

Desde la raíz del repositorio:

```bash
npm install          # instala dependencias del backend
npm run install:client  # instala dependencias del frontend dentro de client/
```

> **Nota:** Puedes ejecutar cada comando manualmente (`npm install` dentro de `client/`) si prefieres manejar los entornos por separado.

## Scripts disponibles

### Backend (`/server`)

- `npm run dev`: levanta la API de Express con recarga automática vía Nodemon en `http://localhost:4000`.
- `npm start`: ejecuta la API sin Nodemon.

### Frontend (`/client`)

Dentro del directorio `client/` puedes ejecutar:

- `npm run dev`: arranca el servidor de desarrollo de Vite en `http://localhost:5173` con proxy hacia la API (`/api`).
- `npm run build`: genera la build de producción en `client/dist`.
- `npm run preview`: sirve la build generada localmente.

## Arquitectura

- **server/**: API REST construida con Express. Expone endpoints para consultar, crear y eliminar turnos.
- **client/**: Interfaz React creada con Vite. Consume la API del backend y muestra los turnos disponibles.

### Endpoints disponibles

- `GET /api/health`: comprueba el estado del backend.
- `GET /api/appointments`: devuelve todos los turnos disponibles ordenados cronológicamente.
- `GET /api/appointments/:id`: recupera un turno específico.
- `POST /api/appointments`: crea un turno nuevo. Requiere los campos `client`, `service` y `time`.
- `DELETE /api/appointments/:id`: elimina un turno existente.

### Flujo en el frontend

La pantalla principal permite:

- Ver el estado de la API y la lista de turnos.
- Registrar un turno con nombre del cliente, servicio y fecha/hora.
- Eliminar turnos existentes.

## Puesta en marcha

1. Abre dos terminales.
2. En la primera, ejecuta `npm run dev` desde la raíz para levantar el backend.
3. En la segunda, entra en `client/` y ejecuta `npm run dev` para iniciar el frontend.
4. Visita `http://localhost:5173` para interactuar con la aplicación.

La configuración de proxy incluida en `vite.config.js` permite que las llamadas a `/api` desde el frontend se redirijan automáticamente al backend local.

## Despliegue gratuito (Fly.io + GitHub Pages)

Esta sección resume la alternativa gratuita Nº 3 propuesta: backend en [Fly.io](https://fly.io/) y frontend en [GitHub Pages](https://pages.github.com/).

### 1. Preparar variables de entorno

- Copia `client/.env.example` a `client/.env.production` (el archivo está en `.gitignore` para que permanezca local) y completa:
  - `VITE_API_BASE_URL`: dominio público que asignará Fly.io a tu API (por ejemplo, `https://turnos-barberia.fly.dev`).
  - `VITE_APP_BASE_PATH`: prefijo donde se publicará la SPA. Si usas GitHub Pages en `https://usuario.github.io/TurnosBarberia/`, asigna `/TurnosBarberia/`. Déjalo vacío (`VITE_APP_BASE_PATH=`) si el sitio vivirá en la raíz del dominio.
- Cuando configures el servicio en Fly.io añade la variable `ALLOWED_ORIGINS` con la URL pública del frontend (por ejemplo, `https://usuario.github.io`). Esto limita las peticiones CORS al origen esperado.

### 2. Backend en Fly.io

1. Instala la CLI (`fly auth signup` / `fly auth login`).
2. Edita `fly.toml` y reemplaza `turnos-barberia-api` por un nombre único para tu app.
3. Ejecuta `fly launch --no-deploy` para crear la aplicación usando el `Dockerfile` incluido (no generes uno nuevo cuando la CLI lo ofrezca).
4. Despliega con `fly deploy` desde la raíz del repositorio. Fly construirá la imagen usando el `Dockerfile`, expondrá el puerto `4000` y aplicará las variables definidas.
5. Registra el dominio asignado por Fly (por ejemplo `https://tu-app.fly.dev`) y úsalo en `VITE_API_BASE_URL`.

> El plan gratuito de Fly.io mantiene las máquinas apagadas cuando no reciben tráfico. El primer request tras un periodo de inactividad puede tardar unos segundos mientras la aplicación despierta.

### 3. Frontend en GitHub Pages

1. Ejecuta la build de producción con las variables anteriores: `cd client && npm install && npm run build -- --mode production`.
2. Publica la carpeta `client/dist` en una rama `gh-pages` (por ejemplo, con `git subtree push --prefix client/dist origin gh-pages`).
3. Activa GitHub Pages en la configuración del repositorio apuntando a la rama `gh-pages` y carpeta raíz (`/`).
4. Comprueba que la SPA carga correctamente en `https://usuario.github.io/TurnosBarberia/` y que consume la API desplegada en Fly.io.

Si en el futuro cambias de dominio o hosting, actualiza `VITE_API_BASE_URL`, `VITE_APP_BASE_PATH` y `ALLOWED_ORIGINS` para mantener el entorno sincronizado.
