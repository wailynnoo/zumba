# Fix Railway Migration Error 🔧

**Error:** `Can't reach database server at postgres.railway.internal:5432`

**Cause:** Command is running during build, not in the running service.

---

## ✅ Solution: Run After Service is Running

### **Step 1: Make Sure Service is Deployed**

1. Go to Railway Dashboard
2. Check that `admin-api` service shows **"Active"** (green)
3. If not deployed, wait for deployment to complete

---

### **Step 2: Run Command in Running Service**

**Option A: Using Service Shell (Recommended)**

1. Go to Railway Dashboard
2. Click on **`admin-api`** service
3. Click **"Deployments"** tab
4. Click on the **latest active deployment** (green checkmark)
5. Look for **"Shell"** or **"Terminal"** button
6. Click to open terminal
7. Run:
   ```bash
   cd /app
   npx prisma migrate deploy
   ```

**Option B: Using Run Command (If Available)**

1. Go to Railway Dashboard
2. Click on **`admin-api`** service
3. Click **"Deployments"** tab
4. Click on the **latest active deployment**
5. Click **"Run Command"** (if available)
6. Make sure to set working directory:
   ```bash
   cd /app && npx prisma migrate deploy
   ```

---

## 🔧 Alternative: Use Public DATABASE_URL

If the internal URL doesn't work, use the public DATABASE_URL:

### **Step 1: Get Public DATABASE_URL**

1. Go to Railway Dashboard
2. Click on **`Postgres`** service
3. Click **"Variables"** tab
4. Find `DATABASE_URL` (the public one, not internal)
5. Copy the value

### **Step 2: Set Environment Variable**

1. Go to **`admin-api`** service
2. Click **"Variables"** tab
3. Add or update `DATABASE_URL` with the public URL
4. It should look like: `postgresql://user:password@hostname.railway.app:5432/railway`

### **Step 3: Run Migration**

1. Go to **`admin-api`** service → **"Deployments"**
2. Click latest deployment → **"Run Command"** or **"Shell"**
3. Run:
   ```bash
   cd /app
   npx prisma migrate deploy
   ```

---

## 🎯 Best Method: Use Postgres Service Directly

### **Step 1: Open Postgres Service**

1. Go to Railway Dashboard
2. Click on **`Postgres`** service (not admin-api)

### **Step 2: Run SQL Directly**

1. Click **"Data"** or **"Query"** tab
2. Run these SQL commands:

```sql
-- Migration 1: Add address and weight columns
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "address" TEXT,
ADD COLUMN IF NOT EXISTS "weight" DOUBLE PRECISION;

-- Migration 2: Add indexes
CREATE INDEX IF NOT EXISTS "users_display_name_idx" ON "users"("display_name");
CREATE INDEX IF NOT EXISTS "users_deleted_at_idx" ON "users"("deleted_at");
```

3. Click **"Run"** or **"Execute"**

---

## ✅ Verify Migrations Applied

**Check if columns exist:**

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('address', 'weight');
```

**Should return:**
- `address` (text)
- `weight` (double precision)

**Check if indexes exist:**

```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'users' 
AND indexname IN ('users_display_name_idx', 'users_deleted_at_idx');
```

**Should return both indexes.**

---

## 🚀 Quick Fix Steps

**Easiest Method:**

1. ✅ Go to Railway Dashboard
2. ✅ Click **`Postgres`** service
3. ✅ Click **"Data"** or **"Query"** tab
4. ✅ Run the SQL commands above
5. ✅ Verify with check queries

**This bypasses Prisma and applies migrations directly!**

---

## 💡 Why This Happens

- **Build time:** Commands in build process can't access internal URLs
- **Runtime:** Commands in running service can access internal URLs
- **Solution:** Run migrations after service is running, or use SQL directly

---

**Use the SQL method - it's the most reliable!** 🚀

