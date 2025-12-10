# Fitness Dance App - Project Structure Templates

**Project:** Fitness Dance App  
**Domain:** zfitdance.com  
**Date:** [Date]

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Member API Structure](#member-api-structure)
3. [Admin API Structure](#admin-api-structure)
4. [Shared Components](#shared-components)
5. [Environment Variables](#environment-variables)
6. [Package.json Examples](#packagejson-examples)
7. [Setup Instructions](#setup-instructions)

---

## 🎯 Overview

### **Project Organization**

We have **two separate API projects** sharing the same database:

1. **Member API** - For mobile app and public website users
2. **Admin API** - For admin panel operations

### **Recommended Structure: Separate Repositories**

```
fitness-dance-backend/
├── member-api/          # Member API project
├── admin-api/           # Admin API project
└── shared/              # Shared utilities (optional)
    ├── prisma/          # Shared Prisma schema
    ├── types/           # Shared TypeScript types
    └── utils/           # Shared utilities
```

**OR**

```
fitness-dance-member-api/    # Separate repository
fitness-dance-admin-api/     # Separate repository
```

---

## 📁 Member API Structure

### **Complete Directory Structure**

```
member-api/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── nodemon.json
├── README.md
│
├── prisma/
│   ├── schema.prisma          # Shared schema (or link to shared)
│   ├── migrations/             # Database migrations
│   └── seed.ts                 # Seed data script
│
├── src/
│   ├── index.ts                # Entry point
│   ├── app.ts                  # Express app setup
│   │
│   ├── config/
│   │   ├── database.ts         # Prisma client setup
│   │   ├── jwt.ts               # JWT configuration
│   │   ├── cloudflare.ts        # Cloudflare Stream config
│   │   └── env.ts               # Environment variables validation
│   │
│   ├── middleware/
│   │   ├── auth.ts              # JWT authentication middleware
│   │   ├── errorHandler.ts      # Error handling middleware
│   │   ├── validator.ts         # Request validation middleware
│   │   └── rateLimiter.ts       # Rate limiting
│   │
│   ├── routes/
│   │   ├── index.ts             # Route aggregator
│   │   ├── auth.routes.ts       # Authentication routes
│   │   ├── videos.routes.ts     # Video routes
│   │   ├── subscriptions.routes.ts
│   │   ├── playlists.routes.ts
│   │   ├── ratings.routes.ts
│   │   ├── feedback.routes.ts
│   │   ├── knowledge.routes.ts
│   │   └── users.routes.ts
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── videos.controller.ts
│   │   ├── subscriptions.controller.ts
│   │   ├── playlists.controller.ts
│   │   ├── ratings.controller.ts
│   │   ├── feedback.controller.ts
│   │   ├── knowledge.controller.ts
│   │   └── users.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts      # JWT auth service (login, register, token refresh)
│   │   ├── videos.service.ts
│   │   ├── subscriptions.service.ts
│   │   ├── playlists.service.ts
│   │   ├── ratings.service.ts
│   │   ├── feedback.service.ts
│   │   ├── knowledge.service.ts
│   │   ├── cloudflare.service.ts
│   │   ├── mmqr.service.ts      # MMQR payment service
│   │   └── users.service.ts
│   │
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── video.model.ts
│   │   ├── subscription.model.ts
│   │   └── ...
│   │
│   ├── dto/
│   │   ├── auth.dto.ts
│   │   ├── video.dto.ts
│   │   ├── subscription.dto.ts
│   │   ├── playlist.dto.ts
│   │   └── ...
│   │
│   ├── utils/
│   │   ├── logger.ts            # Winston/Pino logger
│   │   ├── errors.ts             # Custom error classes
│   │   ├── validators.ts         # Validation helpers
│   │   ├── helpers.ts            # General helpers
│   │   └── constants.ts          # Constants
│   │
│   ├── types/
│   │   ├── express.d.ts          # Express type extensions
│   │   ├── auth.types.ts
│   │   └── ...
│   │
│   └── docs/
│       └── swagger.ts             # Swagger/OpenAPI setup
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── scripts/
    ├── seed.ts
    └── migrate.ts
```

---

## 📁 Admin API Structure

### **Complete Directory Structure**

```
admin-api/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── nodemon.json
├── README.md
│
├── prisma/
│   ├── schema.prisma          # Shared schema (same as member-api)
│   ├── migrations/             # Database migrations
│   └── seed.ts                 # Seed data script
│
├── src/
│   ├── index.ts                # Entry point
│   ├── app.ts                  # Express app setup
│   │
│   ├── config/
│   │   ├── database.ts         # Prisma client setup
│   │   ├── jwt.ts               # JWT configuration
│   │   ├── cloudflare.ts        # Cloudflare Stream config
│   │   └── env.ts               # Environment variables validation
│   │
│   ├── middleware/
│   │   ├── auth.ts              # JWT authentication middleware
│   │   ├── roleCheck.ts         # Admin role verification
│   │   ├── errorHandler.ts      # Error handling middleware
│   │   ├── validator.ts         # Request validation middleware
│   │   └── rateLimiter.ts       # Rate limiting
│   │
│   ├── routes/
│   │   ├── index.ts             # Route aggregator
│   │   ├── auth.routes.ts       # Admin authentication routes
│   │   ├── videos.routes.ts     # Video management routes
│   │   ├── users.routes.ts      # User management routes
│   │   ├── subscriptions.routes.ts
│   │   ├── knowledge.routes.ts
│   │   ├── feedback.routes.ts
│   │   ├── analytics.routes.ts
│   │   └── settings.routes.ts
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── videos.controller.ts
│   │   ├── users.controller.ts
│   │   ├── subscriptions.controller.ts
│   │   ├── knowledge.controller.ts
│   │   ├── feedback.controller.ts
│   │   ├── analytics.controller.ts
│   │   └── settings.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts      # JWT auth service (admin login, token refresh)
│   │   ├── videos.service.ts
│   │   ├── users.service.ts
│   │   ├── subscriptions.service.ts
│   │   ├── knowledge.service.ts
│   │   ├── feedback.service.ts
│   │   ├── analytics.service.ts
│   │   ├── cloudflare.service.ts
│   │   └── settings.service.ts
│   │
│   ├── models/
│   │   └── ...
│   │
│   ├── dto/
│   │   ├── auth.dto.ts
│   │   ├── video.dto.ts
│   │   ├── user.dto.ts
│   │   └── ...
│   │
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── errors.ts
│   │   ├── validators.ts
│   │   ├── helpers.ts
│   │   └── constants.ts
│   │
│   ├── types/
│   │   ├── express.d.ts
│   │   └── ...
│   │
│   └── docs/
│       └── swagger.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── scripts/
    ├── seed.ts
    └── migrate.ts
```

---

## 🔗 Shared Components

### **If Using Monorepo Structure**

```
shared/
├── prisma/
│   └── schema.prisma          # Single source of truth
│
├── types/
│   ├── database.types.ts     # Generated Prisma types
│   ├── api.types.ts           # Shared API types
│   └── common.types.ts
│
├── utils/
│   ├── logger.ts              # Shared logger
│   ├── errors.ts              # Shared error classes
│   └── validators.ts          # Shared validators
│
└── constants/
    └── index.ts               # Shared constants
```

### **If Using Separate Repositories**

- Copy Prisma schema to both projects
- Use npm packages for shared utilities (optional)
- Or maintain separate copies (simpler for small teams)

---

## ⚙️ Environment Variables

### **Member API (.env)**

```env
# Server
NODE_ENV=development
PORT=3001
API_BASE_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://user:password@host:5432/zfitdance

# Cloudflare Stream
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_API_TOKEN=xxx

# MMQR Payment
MMQR_API_URL=https://api.mmqr.com
MMQR_API_KEY=xxx
MMQR_MERCHANT_ID=xxx

# JWT Authentication
JWT_SECRET=xxx
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=xxx
JWT_REFRESH_EXPIRES_IN=30d

# Email (SendGrid)
SENDGRID_API_KEY=xxx
SENDGRID_FROM_EMAIL=noreply@zfitdance.com

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:19006

# Logging
LOG_LEVEL=info
```

### **Admin API (.env)**

```env
# Server
NODE_ENV=development
PORT=3002
API_BASE_URL=http://localhost:3002

# Database (SAME as Member API)
DATABASE_URL=postgresql://user:password@host:5432/zfitdance

# Cloudflare Stream (SAME as Member API)
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_API_TOKEN=xxx

# JWT Authentication (Admin)
JWT_SECRET=xxx
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=xxx
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3003

# Logging
LOG_LEVEL=info
```

---

## 📦 Package.json Examples

### **Member API package.json**

```json
{
  "name": "fitness-dance-member-api",
  "version": "1.0.0",
  "description": "Member API for Fitness Dance App",
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "ts-node prisma/seed.ts",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix"
  },
  "dependencies": {
    "@prisma/client": "^5.7.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.22.4",
    "express-rate-limit": "^7.1.5",
    "swagger-ui-express": "^5.0.0",
    "swagger-jsdoc": "^6.2.8",
    "axios": "^1.6.2",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.5",
    "@types/cors": "^2.8.17",
    "@types/morgan": "^1.9.9",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/swagger-ui-express": "^4.1.6",
    "@types/swagger-jsdoc": "^6.0.4",
    "@types/jest": "^29.5.11",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "nodemon": "^3.0.2",
    "prisma": "^5.7.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "eslint": "^8.56.0"
  }
}
```

### **Admin API package.json**

```json
{
  "name": "fitness-dance-admin-api",
  "version": "1.0.0",
  "description": "Admin API for Fitness Dance App",
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "ts-node prisma/seed.ts",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix"
  },
  "dependencies": {
    "@prisma/client": "^5.7.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.22.4",
    "express-rate-limit": "^7.1.5",
    "swagger-ui-express": "^5.0.0",
    "swagger-jsdoc": "^6.2.8",
    "axios": "^1.6.2",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.5",
    "@types/cors": "^2.8.17",
    "@types/morgan": "^1.9.9",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/swagger-ui-express": "^4.1.6",
    "@types/swagger-jsdoc": "^6.0.4",
    "@types/jest": "^29.5.11",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "nodemon": "^3.0.2",
    "prisma": "^5.7.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "eslint": "^8.56.0"
  }
}
```

---

## 🚀 Setup Instructions

### **1. Initialize Member API Project**

```bash
# Create project directory
mkdir fitness-dance-member-api
cd fitness-dance-member-api

# Initialize npm
npm init -y

# Install dependencies
npm install express cors helmet morgan dotenv bcryptjs jsonwebtoken zod express-rate-limit swagger-ui-express swagger-jsdoc axios winston
npm install -D typescript ts-node nodemon @types/express @types/node @types/cors @types/morgan @types/bcryptjs @types/jsonwebtoken @types/swagger-ui-express @types/swagger-jsdoc prisma @prisma/client

# Initialize TypeScript
npx tsc --init

# Initialize Prisma
npx prisma init

# Create directory structure
mkdir -p src/{config,middleware,routes,controllers,services,models,dto,utils,types,docs}
mkdir -p tests/{unit,integration,e2e}
mkdir -p scripts
```

### **2. Initialize Admin API Project**

```bash
# Create project directory
mkdir fitness-dance-admin-api
cd fitness-dance-admin-api

# Initialize npm
npm init -y

# Install dependencies (same as member-api)
npm install express cors helmet morgan dotenv bcryptjs jsonwebtoken zod express-rate-limit swagger-ui-express swagger-jsdoc axios winston
npm install -D typescript ts-node nodemon @types/express @types/node @types/cors @types/morgan @types/bcryptjs @types/jsonwebtoken @types/swagger-ui-express @types/swagger-jsdoc prisma @prisma/client

# Initialize TypeScript
npx tsc --init

# Initialize Prisma (use same schema as member-api)
npx prisma init

# Create directory structure
mkdir -p src/{config,middleware,routes,controllers,services,models,dto,utils,types,docs}
mkdir -p tests/{unit,integration,e2e}
mkdir -p scripts
```

### **3. Configure TypeScript**

**tsconfig.json (both projects):**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": ["node", "jest"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### **4. Configure Nodemon**

**nodemon.json (both projects):**

```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "ts-node src/index.ts",
  "env": {
    "NODE_ENV": "development"
  }
}
```

### **5. Setup Prisma Schema**

1. Copy the Prisma schema from `Database_Schema_Design.md` to both projects
2. Update `DATABASE_URL` in `.env` files
3. Run migrations:

```bash
# In both projects
npx prisma migrate dev --name init
npx prisma generate
```

### **6. Create Basic Entry Point**

**src/index.ts (Member API):**

```typescript
import app from "./app";
import { logger } from "./utils/logger";
import { config } from "./config/env";

const PORT = config.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Member API server running on port ${PORT}`);
});
```

**src/index.ts (Admin API):**

```typescript
import app from "./app";
import { logger } from "./utils/logger";
import { config } from "./config/env";

const PORT = config.PORT || 3002;

app.listen(PORT, () => {
  logger.info(`Admin API server running on port ${PORT}`);
});
```

---

## 📝 Key Files to Create

### **Priority 1: Core Setup Files**

1. ✅ `src/app.ts` - Express app configuration
2. ✅ `src/config/database.ts` - Prisma client setup
3. ✅ `src/config/env.ts` - Environment variables
4. ✅ `src/middleware/errorHandler.ts` - Error handling
5. ✅ `src/utils/logger.ts` - Logging setup

### **Priority 2: Authentication**

1. ✅ `src/middleware/auth.ts` - Auth middleware
2. ✅ `src/routes/auth.routes.ts` - Auth routes
3. ✅ `src/controllers/auth.controller.ts` - Auth controller
4. ✅ `src/services/auth.service.ts` - Auth service

### **Priority 3: Core Features**

1. ✅ Video routes, controllers, services
2. ✅ Subscription routes, controllers, services
3. ✅ Playlist routes, controllers, services

---

## 🔄 Development Workflow

### **1. Database Changes**

```bash
# Make changes to prisma/schema.prisma
# Run migration
npx prisma migrate dev --name migration_name

# Generate Prisma Client
npx prisma generate

# (Optional) Open Prisma Studio
npx prisma studio
```

### **2. API Development**

```bash
# Start development server
npm run dev

# Run tests
npm test

# Check linting
npm run lint
```

### **3. Deployment**

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 📚 Next Steps

1. **Create Prisma Schema File** - Copy from Database_Schema_Design.md
2. **Set up Basic Express App** - Create app.ts with middleware
3. **Implement Authentication** - Set up JWT authentication (login, register, token refresh)
4. **Create First API Endpoint** - Health check or test endpoint
5. **Set up Swagger Documentation** - API documentation

---

**Ready to start implementing the project structure?**
