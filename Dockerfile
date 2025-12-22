FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Create data directory
RUN mkdir -p data

# Expose port
EXPOSE 3030

# Start server
CMD ["node", "server.js"]
