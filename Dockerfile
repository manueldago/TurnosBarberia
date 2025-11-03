# Imagen ligera para ejecutar el backend en Fly.io
FROM node:18-alpine AS base

WORKDIR /app

# Copiamos los archivos de dependencias primero para aprovechar la cache
COPY package.json package-lock.json* ./

RUN npm install --omit=dev

# Copiamos solo el código del servidor
COPY server ./server

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "server/index.js"]
