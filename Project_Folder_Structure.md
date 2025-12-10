# Project Folder Structure

**Project:** Fitness Dance App  
**Domain:** zfitdance.com  
**Structure:** Monorepo (Recommended for Shared Database)

---

## 📁 Recommended Folder Structure

### **Option 1: Monorepo Structure (RECOMMENDED)**

This structure is recommended because:
- ✅ Shared Prisma schema in one place
- ✅ Easier to manage shared code
- ✅ Single repository for backend
- ✅ Easier database migrations
- ✅ Better for small to medium teams

```
fitness-dance-backend/                    # Root project folder
│
├── prisma/                                # Shared Prisma schema (ROOT LEVEL)
│   ├── schema.prisma                      # Main schema file
│   ├── migrations/                       # Database migrations
│   │   └── ...                            # Migration files
│   └── seed.ts                           # Seed data script
│
├── .env                                   # Root .env (for Prisma migrations)
├── .env.example                           # Example env file
├── .gitignore                             # Git ignore rules
├── package.json                           # Root package.json (optional, for workspace)
│
├── member-api/                            # Member API Project
│   ├── .env                               # Member API environment variables
│   ├── .env.example                       # Member API env example
│   ├── .gitignore                         # Member API gitignore
│   ├── package.json                       # Member API dependencies
│   ├── tsconfig.json                      # TypeScript config
│   ├── nodemon.json                       # Nodemon config
│   ├── README.md                          # Member API docs
│   │
│   ├── src/                               # Source code
│   │   ├── index.ts                       # Entry point
│   │   ├── app.ts                         # Express app
│   │   │
│   │   ├── config/                        # Configuration
│   │   │   ├── database.ts                # Prisma client (references root prisma)
│   │   │   ├── jwt.ts                     # JWT config
│   │   │   ├── env.ts                     # Env validation
│   │   │   └── cloudflare.ts              # Cloudflare config
│   │   │
│   │   ├── middleware/                    # Express middleware
│   │   │   ├── auth.ts                    # JWT auth
│   │   │   ├── errorHandler.ts           # Error handling
│   │   │   └── validator.ts               # Request validation
│   │   │
│   │   ├── routes/                        # API routes
│   │   │   ├── index.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── videos.routes.ts
│   │   │   └── ...
│   │   │
│   │   ├── controllers/                   # Route controllers
│   │   │   ├── auth.controller.ts
│   │   │   ├── videos.controller.ts
│   │   │   └── ...
│   │   │
│   │   ├── services/                      # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── video.service.ts
│   │   │   └── ...
│   │   │
│   │   ├── dto/                           # Data Transfer Objects
│   │   │   ├── auth.dto.ts
│   │   │   └── ...
│   │   │
│   │   ├── utils/                         # Utilities
│   │   │   ├── logger.ts
│   │   │   ├── errors.ts
│   │   │   └── ...
│   │   │
│   │   └── types/                         # TypeScript types
│   │       └── ...
│   │
│   ├── tests/                             # Tests
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   │
│   └── scripts/                           # Utility scripts
│       └── ...
│
├── admin-api/                             # Admin API Project
│   ├── .env                               # Admin API environment variables
│   ├── .env.example                       # Admin API env example
│   ├── .gitignore                         # Admin API gitignore
│   ├── package.json                       # Admin API dependencies
│   ├── tsconfig.json                      # TypeScript config
│   ├── nodemon.json                       # Nodemon config
│   ├── README.md                          # Admin API docs
│   │
│   ├── src/                               # Source code
│   │   ├── index.ts                       # Entry point
│   │   ├── app.ts                         # Express app
│   │   │
│   │   ├── config/                        # Configuration
│   │   │   ├── database.ts                # Prisma client (references root prisma)
│   │   │   ├── jwt.ts                     # JWT config
│   │   │   ├── env.ts                     # Env validation
│   │   │   └── cloudflare.ts              # Cloudflare config
│   │   │
│   │   ├── middleware/                    # Express middleware
│   │   │   ├── auth.ts                    # Admin JWT auth
│   │   │   ├── roleCheck.ts               # Role-based access
│   │   │   ├── errorHandler.ts            # Error handling
│   │   │   └── validator.ts               # Request validation
│   │   │
│   │   ├── routes/                        # API routes
│   │   │   ├── index.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── videos.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   └── ...
│   │   │
│   │   ├── controllers/                   # Route controllers
│   │   │   ├── auth.controller.ts
│   │   │   ├── videos.controller.ts
│   │   │   └── ...
│   │   │
│   │   ├── services/                      # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── video.service.ts
│   │   │   └── ...
│   │   │
│   │   ├── dto/                           # Data Transfer Objects
│   │   │   ├── auth.dto.ts
│   │   │   └── ...
│   │   │
│   │   ├── utils/                         # Utilities
│   │   │   ├── logger.ts
│   │   │   ├── errors.ts
│   │   │   └── ...
│   │   │
│   │   └── types/                         # TypeScript types
│   │       └── ...
│   │
│   ├── tests/                             # Tests
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   │
│   └── scripts/                           # Utility scripts
│       └── ...
│
└── shared/                                # Shared code (optional)
    ├── types/                             # Shared TypeScript types
    │   └── common.types.ts
    │
    ├── utils/                             # Shared utilities
    │   ├── constants.ts
    │   └── helpers.ts
    │
    └── validators/                         # Shared validators
        └── ...
```

---

## 🔐 Environment Variables Structure

### **Root Level `.env` (for Prisma migrations)**

**Location:** `fitness-dance-backend/.env`

```env
# Database Connection (Shared by both APIs)
DATABASE_URL="postgresql://user:password@localhost:5432/fitness_dance_dev?schema=public"

# Used for Prisma migrations and seed scripts
```

**Note:** This is used when running Prisma commands from the root directory.

---

### **Member API `.env`**

**Location:** `fitness-dance-backend/member-api/.env`

```env
# Database Connection (Same as root)
DATABASE_URL="postgresql://user:password@localhost:5432/fitness_dance_dev?schema=public"

# Server Configuration
NODE_ENV=development
PORT=3001
API_BASE_URL=http://localhost:3001

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=7d

# Cloudflare Stream
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token

# Supabase Storage (for file uploads)
SUPABASE_URL=your-supabase-url
SUPABASE_STORAGE_BUCKET=your-bucket-name
SUPABASE_STORAGE_KEY=your-storage-key

# SendGrid (Email)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@zfitdance.com

# OAuth (Google, Apple)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key

# SMS Service (for phone verification)
SMS_API_KEY=your-sms-api-key
SMS_API_URL=your-sms-api-url

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:19006
```

---

### **Admin API `.env`**

**Location:** `fitness-dance-backend/admin-api/.env`

```env
# Database Connection (Same as root)
DATABASE_URL="postgresql://user:password@localhost:5432/fitness_dance_dev?schema=public"

# Server Configuration
NODE_ENV=development
PORT=3002
API_BASE_URL=http://localhost:3002

# JWT Configuration (Different from Member API)
JWT_SECRET=your-admin-super-secret-jwt-key-here
JWT_EXPIRES_IN=30m
JWT_REFRESH_SECRET=your-admin-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=7d

# Cloudflare Stream
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token

# Supabase Storage (for file uploads)
SUPABASE_URL=your-supabase-url
SUPABASE_STORAGE_BUCKET=your-bucket-name
SUPABASE_STORAGE_KEY=your-storage-key

# SendGrid (Email)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@zfitdance.com

# CORS (Admin Panel only)
CORS_ORIGIN=http://localhost:3003
```

---

## 📝 Environment Files Summary

| File Location | Purpose | Used By |
|--------------|---------|---------|
| `/.env` | Prisma migrations | Prisma CLI (root level) |
| `/member-api/.env` | Member API config | Member API server |
| `/admin-api/.env` | Admin API config | Admin API server |

---

## 🔧 Prisma Schema Location

### **Shared Schema (Root Level)**

**Location:** `fitness-dance-backend/prisma/schema.prisma`

Both APIs reference this same schema file:

**Member API - `member-api/src/config/database.ts`:**
```typescript
import { PrismaClient } from '../../../prisma/generated/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

**Admin API - `admin-api/src/config/database.ts`:**
```typescript
import { PrismaClient } from '../../../prisma/generated/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

---

## 🚀 Setup Instructions

### **1. Create Root Directory**

```bash
mkdir fitness-dance-backend
cd fitness-dance-backend
```

### **2. Initialize Root Prisma**

```bash
# Create prisma directory
mkdir prisma

# Copy schema.prisma to prisma/schema.prisma
# (Already done - we have prisma/schema.prisma)

# Install Prisma CLI (root level)
npm init -y
npm install -D prisma
npm install @prisma/client

# Generate Prisma Client
npx prisma generate
```

### **3. Create Member API**

```bash
mkdir member-api
cd member-api

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express @prisma/client jsonwebtoken bcrypt zod dotenv cors
npm install -D typescript @types/express @types/node @types/jsonwebtoken @types/bcrypt ts-node nodemon prisma

# Create .env file
touch .env
# Copy from .env.example template above
```

### **4. Create Admin API**

```bash
# From root directory
mkdir admin-api
cd admin-api

# Initialize Node.js project
npm init -y

# Install dependencies (same as member-api)
npm install express @prisma/client jsonwebtoken bcrypt zod dotenv cors
npm install -D typescript @types/express @types/node @types/jsonwebtoken @types/bcrypt ts-node nodemon prisma

# Create .env file
touch .env
# Copy from .env.example template above
```

### **5. Root .env for Prisma**

```bash
# From root directory
touch .env

# Add DATABASE_URL
echo 'DATABASE_URL="postgresql://user:password@localhost:5432/fitness_dance_dev?schema=public"' > .env
```

---

## 📋 .gitignore Structure

### **Root `.gitignore`**

```gitignore
# Dependencies
node_modules/
package-lock.json

# Environment variables
.env
.env.local
.env.*.local

# Prisma
prisma/migrations/
prisma/generated/

# Logs
logs/
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
```

### **Member API `.gitignore`**

```gitignore
# Dependencies
node_modules/
package-lock.json

# Environment variables
.env
.env.local

# Build
dist/
build/

# Logs
logs/
*.log

# Tests
coverage/
```

### **Admin API `.gitignore`**

```gitignore
# Same as Member API
node_modules/
package-lock.json
.env
.env.local
dist/
build/
logs/
*.log
coverage/
```

---

## 🎯 Key Points

### **1. Prisma Schema Location**
- ✅ **Single source of truth:** `prisma/schema.prisma` at root level
- ✅ Both APIs reference the same schema
- ✅ Migrations run from root directory

### **2. Environment Variables**
- ✅ **Root `.env`:** For Prisma migrations only
- ✅ **Member API `.env`:** Member API configuration
- ✅ **Admin API `.env`:** Admin API configuration
- ✅ Each API has its own `.env.example` template

### **3. Database Connection**
- ✅ Both APIs use the same `DATABASE_URL`
- ✅ Both connect to the same PostgreSQL database
- ✅ Prisma Client generated once, used by both

### **4. Running Commands**

**Prisma Commands (from root):**
```bash
# From fitness-dance-backend/
npx prisma migrate dev
npx prisma generate
npx prisma studio
```

**Member API (from member-api/):**
```bash
# From fitness-dance-backend/member-api/
npm run dev
npm run build
npm test
```

**Admin API (from admin-api/):**
```bash
# From fitness-dance-backend/admin-api/
npm run dev
npm run build
npm test
```

---

## 🔄 Alternative: Separate Repositories

If you prefer separate repositories:

```
fitness-dance-member-api/     # Separate repo
├── prisma/
│   └── schema.prisma          # Copy of shared schema
├── .env
└── src/

fitness-dance-admin-api/       # Separate repo
├── prisma/
│   └── schema.prisma          # Copy of shared schema
├── .env
└── src/
```

**Note:** This requires keeping schemas in sync manually.

---

## ✅ Recommended Structure

**Use the Monorepo Structure** because:
1. ✅ Single Prisma schema (no sync issues)
2. ✅ Easier migrations
3. ✅ Shared code possible
4. ✅ Better for small teams
5. ✅ Simpler deployment setup

---

**Ready to set up the folder structure?**

