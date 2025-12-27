# Dockerfile for admin-api
# Build from fitness-dance-backend root directory
# Updated: Force rebuild v3

FROM node:20-slim

# Install ffmpeg for video conversion
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/* && \
    echo "FFmpeg installed:" && ffmpeg -version | head -1

# Set working directory
WORKDIR /app

# Copy prisma folder first (needed for prisma generate)
COPY prisma ./prisma

# Copy admin-api package files
COPY admin-api/package.json ./admin-api/
COPY admin-api/package-lock.json ./admin-api/

# Install dependencies (skip postinstall - we'll run prisma generate manually)
WORKDIR /app/admin-api
RUN npm ci --ignore-scripts

# Verify @prisma/client is installed
RUN ls -la node_modules/@prisma/client || echo "prisma client not found"

# Copy admin-api source code (excluding node_modules via .dockerignore)
WORKDIR /app
COPY admin-api ./admin-api/

# Generate Prisma client
WORKDIR /app/admin-api
RUN npx prisma generate --schema=/app/prisma/schema.prisma

# Build TypeScript
RUN npx tsc

# Remove devDependencies after build
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

