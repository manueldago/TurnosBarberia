# Turnos Barbería

Aplicación dividida en **backend** y **frontend** para gestionar turnos de una barbería.

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
