# movies-service/Dockerfile
FROM node:22-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el código fuente
COPY . .

# Exponer el puerto
EXPOSE 3004

# Comando para iniciar la aplicación
CMD ["node", "seed.js"]
CMD ["node", "server.js"]
