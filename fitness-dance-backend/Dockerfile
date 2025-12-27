# Dockerfile for admin-api
# Build from fitness-dance-backend root directory
# Updated: Force rebuild v5

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

# Install all dependencies (let postinstall run - it will try to generate but may fail, that's OK)
WORKDIR /app/admin-api
RUN npm install || echo "Install completed with warnings"

# Install matching versions of both packages (must match exactly)
RUN npm install @prisma/client@7.1.0 prisma@7.1.0 --save-exact --legacy-peer-deps && \
    npm install prisma@7.1.0 --save-dev --save-exact --legacy-peer-deps

# Debug: Check what's actually installed
RUN echo "=== Debug: Checking installations ===" && \
    echo "node_modules/@prisma exists:" && ls -la node_modules/@prisma 2>&1 || echo "NO @prisma folder" && \
    echo "node_modules/@prisma/client exists:" && ls -la node_modules/@prisma/client 2>&1 || echo "NO @prisma/client folder" && \
    echo "npm ls output:" && npm ls @prisma/client 2>&1 && \
    echo "Checking package.json:" && cat package.json | grep -A 2 prisma

# Debug: Verify @prisma/client is actually accessible
WORKDIR /app/admin-api
RUN echo "=== Final verification ===" && \
    test -f node_modules/@prisma/client/package.json && echo "✅ @prisma/client package.json exists" || echo "❌ package.json missing" && \
    test -d node_modules/@prisma/client && echo "✅ @prisma/client directory exists" || echo "❌ directory missing" && \
    cat node_modules/@prisma/client/package.json | grep version && \
    which node && \
    node --version && \
    npm --version

# Set NODE_PATH to help Prisma find @prisma/client, then generate
WORKDIR /app/admin-api
ENV NODE_PATH=/app/admin-api/node_modules
RUN NODE_PATH=/app/admin-api/node_modules ./node_modules/.bin/prisma generate --schema=/app/prisma/schema.prisma

# Build TypeScript
RUN npx tsc

# Remove devDependencies after build
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

