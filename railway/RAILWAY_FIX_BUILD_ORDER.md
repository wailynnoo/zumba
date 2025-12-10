# Fix Build Command Order 🔧

**Error:** `Module '"@prisma/client"' has no exported member 'PrismaClient'`

**Problem:** Prisma Client must be generated BEFORE TypeScript compilation!

---

## ✅ Fix Build Command Order

### **Current (WRONG):**

```
cd admin-api && npm install && npm run build && cd .. && npx prisma generate
```

**Problem:** Building TypeScript before generating Prisma Client!

### **Correct (RIGHT):**

```
cd admin-api && npm install && cd .. && npx prisma generate && cd admin-api && npm run build
```

**Solution:** Generate Prisma Client FIRST, then build!

---

## 📝 Step-by-Step Fix

### **Step 1: Update Build Command**

1. Railway Dashboard → `admin-api` service
2. Click **"Settings"** tab
3. Click **"Build"** link in right sidebar (or scroll to "Custom Build Command")
4. Find **"Custom Build Command"** field
5. **Replace** with:
   ```
   cd admin-api && npm install && cd .. && npx prisma generate && cd admin-api && npm run build
   ```
6. Click **"Save"** (or auto-saves)

---

## 🎯 What This Command Does (In Order)

1. `cd admin-api` - Go to admin-api folder
2. `npm install` - Install dependencies
3. `cd ..` - Go back to root folder (where prisma/ is)
4. `npx prisma generate` - **Generate Prisma Client FIRST** ✅
5. `cd admin-api` - Go back to admin-api folder
6. `npm run build` - **Then build TypeScript** ✅

---

## 🗄️ Access Database (Postgres Service)

### **Step 1: Open Postgres Service**

1. Railway Dashboard
2. Click on **`Postgres`** service (left sidebar or architecture view)

### **Step 2: Find Data Tab**

1. Click **"Database"** tab (main tab, not "Settings")
2. You'll see sub-tabs: **"Data"**, "Extensions", "Credentials"
3. Click **"Data"** sub-tab
4. You'll see all your tables!

### **Step 3: Run SQL Query**

1. In the **"Data"** tab, look for:
   - A query input box, OR
   - A "Query" button, OR
   - Click on a table to see its data
2. If you see a query editor, paste:

   ```sql
   ALTER TABLE "users"
   ADD COLUMN IF NOT EXISTS "address" TEXT,
   ADD COLUMN IF NOT EXISTS "weight" DOUBLE PRECISION;

   CREATE INDEX IF NOT EXISTS "users_display_name_idx" ON "users"("display_name");
   CREATE INDEX IF NOT EXISTS "users_deleted_at_idx" ON "users"("deleted_at");
   ```

---

## 🎯 Alternative: Use Railway CLI

If you can't find the query editor in the Data tab:

1. **Install Railway CLI** (if not installed):

   ```bash
   npm install -g @railway/cli
   ```

2. **Login:**

   ```bash
   railway login
   ```

3. **Connect to Postgres:**
   ```bash
   railway connect postgres
   ```
   This opens a PostgreSQL shell where you can run SQL directly!

---

## 📋 Summary

**Build Command (FIXED):**

```
cd admin-api && npm install && cd .. && npx prisma generate && cd admin-api && npm run build
```

**Start Command (Keep as is):**

```
cd admin-api && npm start
```

**Database Access:**

- Postgres service → **"Database"** tab → **"Data"** sub-tab
- Or use `railway connect postgres` for SQL shell

---

**Fix the build command order, then Railway will redeploy successfully!** 🚀
