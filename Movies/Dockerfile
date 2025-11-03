# Use Node 22 for best performance and security
FROM node:22-alpine

WORKDIR /app

# Copy dependency files first (for better layer caching)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the rest of the source code
COPY . .

# Expose the service port
EXPOSE 3002

# Seed the database, then start the server
CMD ["sh", "-c", "node seed.js && node server.js"]
