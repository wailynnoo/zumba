# Prisma 7 Setup Guide

**Prisma Version:** 7.1.0  
**Status:** ✅ Schema formatted successfully

---

## ✅ What's Fixed

1. ✅ Removed `url` from `datasource` in `schema.prisma` (Prisma 7 requirement)
2. ✅ Schema formatted successfully
3. ✅ Ready for Prisma Client generation

---

## 🔧 Prisma 7 Changes

### **Schema File (`schema.prisma`)**

**Before (Prisma 5-6):**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**After (Prisma 7):**

```prisma
datasource db {
  provider = "postgresql"
  // url is now passed to PrismaClient constructor
}
```

---

## 📝 Using Prisma Client in Your Code

### **Member API - `member-api/src/config/database.ts`**

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

### **Admin API - `admin-api/src/config/database.ts`**

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

---

## 🚀 Prisma Commands

### **Generate Prisma Client**

```bash
# From fitness-dance-backend/
npx prisma generate
```

This will generate the Prisma Client in `node_modules/.prisma/client/`

### **Create Migration**

```bash
# From fitness-dance-backend/
npx prisma migrate dev --name init
```

**Note:** Make sure you have `DATABASE_URL` in your `.env` file at the root level.

### **Apply Migrations**

```bash
npx prisma migrate deploy
```

### **Open Prisma Studio**

```bash
npx prisma studio
```

---

## ⚙️ Environment Variables

**Root `.env` file must contain:**

```env
DATABASE_URL=postgresql://user:password@localhost:5432/fitness_dance_dev?schema=public
```

This is used by:

- Prisma Migrate commands
- Prisma Studio
- Prisma Client (when passed in constructor)

---

## 📋 Next Steps

1. ✅ Schema formatted
2. ⏭️ Create `.env` file with `DATABASE_URL`
3. ⏭️ Run `npx prisma generate`
4. ⏭️ Run `npx prisma migrate dev --name init`
5. ⏭️ Set up API projects with Prisma Client

---

## 🔍 Troubleshooting

### **Error: "DATABASE_URL is not set"**

**Solution:** Make sure you have a `.env` file in `fitness-dance-backend/` with `DATABASE_URL`

### **Error: "Could not find Prisma Schema"**

**Solution:** Run commands from `fitness-dance-backend/` directory, not from `prisma/` subdirectory

### **Error: "Connection refused"**

**Solution:**

1. Make sure PostgreSQL is running
2. Check your `DATABASE_URL` is correct
3. Verify database exists

---

## ✅ Verification

Test that everything works:

```bash
# 1. Format schema (should work)
npx prisma format

# 2. Generate client (should work)
npx prisma generate

# 3. Check connection (if database is set up)
npx prisma db pull
```

---

**Prisma 7 is ready to use!** 🎉
