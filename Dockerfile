FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache openssl

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build frontend
RUN npm run build

# Create data directory
RUN mkdir -p data

# Expose port
EXPOSE 3030

# Start server
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
