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

# Install dependencies
WORKDIR /app/admin-api
RUN npm install --ignore-scripts

# Force install @prisma/client as dependency (not dev) and prisma CLI
RUN npm install @prisma/client@^7.1.0 --save && \
    npm install prisma@^7.1.0 --save-dev

# Verify both are installed (with proper error checking)
RUN echo "=== Verifying installations ===" && \
    if [ -d "node_modules/@prisma/client" ]; then \
        echo "✅ @prisma/client directory exists"; \
    else \
        echo "❌ @prisma/client directory MISSING"; \
        exit 1; \
    fi && \
    if [ -d "node_modules/prisma" ]; then \
        echo "✅ prisma CLI directory exists"; \
    else \
        echo "❌ prisma CLI directory MISSING"; \
        exit 1; \
    fi && \
    npm ls @prisma/client prisma

# Generate Prisma client (run from admin-api where node_modules exists)
RUN ./node_modules/.bin/prisma generate --schema=/app/prisma/schema.prisma

# Build TypeScript
RUN npx tsc

# Remove devDependencies after build
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

