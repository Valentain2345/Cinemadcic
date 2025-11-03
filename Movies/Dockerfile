# movies-service/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el código fuente
COPY . .

# Exponer el puerto
EXPOSE 3002

# Comando para iniciar la aplicación
FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the application code
COPY . .

# Expose the port for the application
EXPOSE 3002

# Run the seed script first, then start the server
CMD ["sh", "-c", "node server.js && node seed.js"]
