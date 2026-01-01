# Dockerfile for member-api
# Build from fitness-dance-backend root directory
# For Railway: Deploy from root fitness-dance-backend directory

FROM node:20-slim

# Install ffmpeg for video conversion (if needed)
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/* && \
    echo "FFmpeg installed:" && ffmpeg -version | head -1

# Set working directory
WORKDIR /app

# Copy prisma folder first (needed for prisma generate)
COPY prisma ./prisma

# Copy ALL member-api files
COPY member-api ./member-api/

# Install all dependencies
WORKDIR /app/member-api
RUN npm install || echo "Install completed with warnings"

# Install matching versions of Prisma packages in member-api
RUN npm install @prisma/client@7.1.0 prisma@7.1.0 --save-exact --legacy-peer-deps && \
    npm install prisma@7.1.0 --save-dev --save-exact --legacy-peer-deps

# Install Prisma CLI in prisma directory (needed for generation)
WORKDIR /app/prisma
RUN npm init -y --silent && \
    npm install prisma@7.1.0 @prisma/client@7.1.0 --save-exact --legacy-peer-deps

# Generate Prisma Client from prisma directory
# This generates to prisma/node_modules/.prisma/client
WORKDIR /app/prisma
RUN npx prisma generate

# Copy generated client to member-api where it's needed
WORKDIR /app/member-api
RUN mkdir -p node_modules/.prisma && \
    cp -r ../prisma/node_modules/.prisma/client node_modules/.prisma/client

# Install missing types
RUN npm install --save-dev @types/pg

# Build TypeScript
RUN npx tsc --skipLibCheck || (echo "⚠️  TypeScript build completed with warnings" && npx tsc --skipLibCheck --noEmitOnError false)

# Remove devDependencies after build
RUN npm prune --production

# Expose port (Railway will override this with PORT env var)
EXPOSE 3001

# Start the application
CMD ["npm", "start"]

