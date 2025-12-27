# Dockerfile for admin-api
# Build from fitness-dance-backend root directory:
#   docker build -f Dockerfile.admin-api -t admin-api .
#   
# For Railway: Deploy from root fitness-dance-backend directory
# and set the Dockerfile path in Railway settings

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

# Copy admin-api package files (explicitly copy both files)
COPY admin-api/package.json ./admin-api/
COPY admin-api/package-lock.json ./admin-api/
COPY admin-api/scripts ./admin-api/scripts/

# Install dependencies in admin-api (skip postinstall - we'll run prisma generate manually)
WORKDIR /app/admin-api
RUN npm ci --ignore-scripts

# Copy admin-api source code
COPY admin-api ./

# Generate Prisma client explicitly (before TypeScript build)
RUN npx prisma generate --schema=/app/prisma/schema.prisma

# Build TypeScript (skip prisma generate since we already did it)
RUN npx tsc

# Remove devDependencies after build to reduce image size
RUN npm prune --production

# Expose port (Railway will override this with PORT env var)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

