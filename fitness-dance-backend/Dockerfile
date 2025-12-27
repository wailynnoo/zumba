# Dockerfile for admin-api
# Build from fitness-dance-backend root directory
# Updated: Force rebuild v4

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

# Copy ALL admin-api files first (before npm install)
COPY admin-api ./admin-api/

# Install dependencies (skip postinstall - we'll run prisma generate manually)
WORKDIR /app/admin-api
RUN npm ci --ignore-scripts

# Generate Prisma client
RUN npx prisma generate --schema=/app/prisma/schema.prisma

# Build TypeScript
RUN npx tsc

# Remove devDependencies after build
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

