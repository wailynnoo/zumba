# Dockerfile for admin-api
# Build from fitness-dance-backend root directory:
#   docker build -f Dockerfile -t admin-api .
#   
# For Railway: Deploy from root fitness-dance-backend directory
# Railway auto-detects this Dockerfile for admin-api service
# (member-api uses Dockerfile.member-api as configured in member-api/railway.toml)

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

# Install Prisma CLI and @prisma/client in prisma directory (needed for generation)
# The generate-prisma.js script runs from the schema directory and needs @prisma/client there
WORKDIR /app/prisma
RUN npm init -y --silent && \
    npm install prisma@7.1.0 @prisma/client@7.1.0 --save-exact --legacy-peer-deps

# Copy admin-api package files
COPY admin-api/package*.json ./admin-api/
COPY admin-api/scripts ./admin-api/scripts/

# Install dependencies in admin-api
WORKDIR /app/admin-api
RUN npm ci

# Copy admin-api source code
COPY admin-api ./

# Build TypeScript (this will also run prisma generate via npm run build)
WORKDIR /app/admin-api
RUN npm run build && \
    # Copy generated Prisma client from prisma directory to admin-api where it's needed
    mkdir -p node_modules/.prisma && \
    cp -r ../prisma/node_modules/.prisma/client node_modules/.prisma/client

# Remove devDependencies after build to reduce image size
RUN npm prune --production

# Expose port (Railway will override this with PORT env var)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
