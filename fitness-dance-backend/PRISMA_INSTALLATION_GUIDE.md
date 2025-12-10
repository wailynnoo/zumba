# Prisma Client Installation Guide

**Question:** Where should `@prisma/client` be installed in our monorepo structure?

---

## 📁 Current Folder Structure

```
fitness-dance-backend/              # Root
├── prisma/                         # Shared schema (ROOT LEVEL)
│   └── schema.prisma
├── package.json                    # Root package.json
├── member-api/                     # Member API project
│   └── (no package.json yet)
└── admin-api/                      # Admin API project
    └── (no package.json yet)
```

---

## ✅ Recommended Installation Strategy

### **Option 1: Root + Each API (RECOMMENDED)**

**Install in 3 places:**

1. **Root Level** (`fitness-dance-backend/`)
   - Install `prisma` (CLI) and `@prisma/client`
   - Used for: Generating Prisma Client, running migrations

2. **Member API** (`member-api/`)
   - Install `@prisma/client`
   - Used for: Importing PrismaClient in Member API code

3. **Admin API** (`admin-api/`)
   - Install `@prisma/client`
   - Used for: Importing PrismaClient in Admin API code

**Why this approach?**
- ✅ Each project is self-contained
- ✅ Can deploy APIs independently
- ✅ Clear dependencies per project
- ✅ Works with separate deployments

---

## 📝 Installation Commands

### **Step 1: Install at Root Level**

```bash
cd fitness-dance-backend
npm install -D prisma
npm install @prisma/client
```

**Purpose:**
- Run `npx prisma generate` from root
- Run `npx prisma migrate` from root
- Generate Prisma Client once

### **Step 2: Install in Member API**

```bash
cd member-api
npm init -y
npm install @prisma/client
```

**Purpose:**
- Import `PrismaClient` in Member API code
- Use generated types in Member API

### **Step 3: Install in Admin API**

```bash
cd admin-api
npm init -y
npm install @prisma/client
```

**Purpose:**
- Import `PrismaClient` in Admin API code
- Use generated types in Admin API

---

## 🔧 How It Works

### **1. Generate Prisma Client (Root Level)**

```bash
# From fitness-dance-backend/
npx prisma generate
```

This generates the Prisma Client in:
- `fitness-dance-backend/node_modules/.prisma/client/`

### **2. Import in Member API**

**File:** `member-api/src/config/database.ts`
```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export default prisma;
```

**How it works:**
- Member API has `@prisma/client` in its `node_modules`
- When you import, it resolves to the local installation
- The generated client types are shared (generated once at root)

### **3. Import in Admin API**

**File:** `admin-api/src/config/database.ts`
```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export default prisma;
```

**How it works:**
- Admin API has `@prisma/client` in its `node_modules`
- Same as Member API

---

## 📋 Complete Installation Checklist

### **Root Level** (`fitness-dance-backend/`)
- [ ] `npm install -D prisma`
- [ ] `npm install @prisma/client`
- [ ] Create `.env` with `DATABASE_URL`
- [ ] Run `npx prisma generate`

### **Member API** (`member-api/`)
- [ ] `npm init -y`
- [ ] `npm install @prisma/client`
- [ ] Create `.env` with `DATABASE_URL`
- [ ] Create `src/config/database.ts`

### **Admin API** (`admin-api/`)
- [ ] `npm init -y`
- [ ] `npm install @prisma/client`
- [ ] Create `.env` with `DATABASE_URL`
- [ ] Create `src/config/database.ts`

---

## 🔄 Alternative: Workspace Setup (Advanced)

If you want to use npm workspaces or pnpm workspaces:

**Root `package.json`:**
```json
{
  "name": "fitness-dance-backend",
  "private": true,
  "workspaces": [
    "member-api",
    "admin-api"
  ]
}
```

Then install once at root:
```bash
npm install -w @prisma/client
```

**Pros:**
- Single installation
- Shared dependencies
- Faster installs

**Cons:**
- More complex setup
- Requires workspace support
- Less flexible for separate deployments

---

## ✅ Recommended Approach

**Use Option 1 (Root + Each API)** because:
1. ✅ Simple and clear
2. ✅ Each API is independent
3. ✅ Easy to deploy separately
4. ✅ No workspace complexity
5. ✅ Works with any deployment setup

---

## 🚀 Quick Start

```bash
# 1. Root level
cd fitness-dance-backend
npm install -D prisma
npm install @prisma/client
npx prisma generate

# 2. Member API
cd member-api
npm init -y
npm install @prisma/client

# 3. Admin API
cd ../admin-api
npm init -y
npm install @prisma/client
```

---

**Summary: Install `@prisma/client` in all 3 locations (root, member-api, admin-api)!**

