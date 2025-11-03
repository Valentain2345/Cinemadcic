# Use Node.js Alpine image for minimal size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if any)
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy the rest of the app's source code
COPY . .

# Build the React app
RUN npm run build

# Install http-server globally
RUN npm install -g http-server

# Expose port 8080 (default for http-server)
EXPOSE 8080

# Start http-server to serve the built React app
CMD ["http-server", "dist", "-p", "8080"]
