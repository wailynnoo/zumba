# Fix: Remove Migrate Deploy from Build Command 🚨

**Error:** `ERROR: failed to build: failed to solve: process "sh -c npx prisma migrate deploy"`

**Problem:** `npx prisma migrate deploy` is running during build, but database isn't accessible during build phase.

---

## ✅ Solution: Remove from Build Command

### **Step 1: Check Railway Build Command**

1. Go to Railway Dashboard
2. Click on **`admin-api`** service
3. Click **"Settings"** tab
4. Scroll to **"Build Command"** section
5. Check what's currently there

---

### **Step 2: Fix Build Command**

**Current (WRONG):**

```bash
cd admin-api && npm install && npm run build && cd .. && npx prisma generate && npx prisma migrate deploy
```

**Correct (RIGHT):**

```bash
cd admin-api && npm install && npm run build && cd .. && npx prisma generate
```

**Remove:** `&& npx prisma migrate deploy` from the end!

---

### **Step 3: Update Build Command in Railway**

1. In Railway Dashboard → `admin-api` → **Settings**
2. Find **"Build Command"** field
3. Replace with:
   ```
   cd admin-api && npm install && npm run build && cd .. && npx prisma generate
   ```
4. Click **"Save"** or **"Update"**
5. Railway will automatically redeploy

---

## 🎯 Why This Happens

- **Build Phase:** Runs before service starts, database not accessible
- **Runtime Phase:** Service is running, database is accessible
- **Solution:** Run migrations AFTER deployment, not during build

---

## ✅ Run Migrations After Deployment

**After the build succeeds and service is running:**

### **Option 1: Run SQL Directly (Easiest)**

1. Go to Railway Dashboard
2. Click **`Postgres`** service
3. Click **"Data"** or **"Query"** tab
4. Run:

   ```sql
   ALTER TABLE "users"
   ADD COLUMN IF NOT EXISTS "address" TEXT,
   ADD COLUMN IF NOT EXISTS "weight" DOUBLE PRECISION;

   CREATE INDEX IF NOT EXISTS "users_display_name_idx" ON "users"("display_name");
   CREATE INDEX IF NOT EXISTS "users_deleted_at_idx" ON "users"("deleted_at");
   ```

### **Option 2: Run Command in Running Service**

1. Go to Railway Dashboard → `admin-api` service
2. Click **"Deployments"** tab
3. Click on **latest active deployment** (green checkmark)
4. Click **"Shell"** or **"Terminal"** button
5. Run:
   ```bash
   cd /app
   npx prisma migrate deploy
   ```

---

## 📋 Correct Build & Start Commands

**Build Command:**

```bash
cd admin-api && npm install && npm run build && cd .. && npx prisma generate
```

**Start Command:**

```bash
cd admin-api && npm start
```

**Migrations:** Run separately AFTER deployment ✅

---

## 🚀 Quick Fix Steps

1. ✅ Railway Dashboard → `admin-api` → **Settings**
2. ✅ Find **"Build Command"**
3. ✅ Remove `&& npx prisma migrate deploy` from the end
4. ✅ Save (Railway will redeploy)
5. ✅ Wait for deployment to complete
6. ✅ Run migrations using SQL or Shell (see above)

---

**Fix the build command first, then run migrations separately!** 🎯
