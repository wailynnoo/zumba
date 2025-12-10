# Fix Railway Build Error - Prisma Client Issue

**Error:** `Property 'adminRefreshToken' does not exist on type 'PrismaClient'`

**Problem:** Prisma Client must be generated BEFORE TypeScript compilation, and the build command order is wrong.

---

## ✅ Solution: Fix Build Command Order

### **Current Build Command (WRONG):**

```
cd admin-api && npm install && cd .. && npx prisma generate && cd admin-api && npm run build
```

**Problem:** The Prisma client generation might not be completing before TypeScript starts, or it's generating in the wrong location.

### **Correct Build Command (RIGHT):**

**Option 1: Generate Prisma Client First (Recommended)**

```
cd admin-api && npm install && cd .. && npx prisma generate --schema=prisma/schema.prisma && cd admin-api && npm run build
```

**Option 2: Use postinstall script (Alternative)**

```
cd admin-api && npm install && npm run build
```

(This relies on the `postinstall` script in package.json which runs `npx prisma generate`)

---

## 📋 Step-by-Step Fix

### **Step 1: Update Railway Build Command**

1. **Go to Railway Dashboard**

   - https://railway.app/dashboard
   - Select project: `fitness-dance-backend`
   - Click on **`admin-api`** service

2. **Go to Settings → Build Tab**

   - Click **"Settings"** tab
   - Click **"Build"** link in right sidebar (or scroll to "Custom Build Command")

3. **Update Build Command**

   - Find **"Custom Build Command"** field
   - **Replace** with:
     ```
     cd admin-api && npm install && cd .. && npx prisma generate --schema=prisma/schema.prisma && cd admin-api && npm run build
     ```
   - Click **"Save"** (or wait for auto-save)

4. **Verify Start Command**
   - Go to **"Deploy"** tab (or "Settings" → "Deploy")
   - **"Custom Start Command"** should be:
     ```
     cd admin-api && npm start
     ```

---

## 🔍 Why This Happens

1. **Prisma Client Generation:** The Prisma client must be generated from `schema.prisma` which includes the `AdminRefreshToken` model
2. **TypeScript Compilation:** TypeScript needs the generated Prisma client types to compile
3. **Build Order:** If TypeScript compiles before Prisma client is generated, it won't find the `adminRefreshToken` property

---

## ✅ After Fixing Build Command

1. **Railway will automatically redeploy**
2. **Wait for build to complete**
3. **Check build logs** - should see:
   ```
   ✔ Generated Prisma Client (v7.1.0) to ./node_modules/@prisma/client
   ```
   Then:
   ```
   > admin-api@1.0.0 build
   > tsc
   ```
   (No errors!)

---

## 🚀 Next Steps After Build Succeeds

### **Step 1: Run Database Migration**

**⚠️ Important:** The database (Postgres) is a separate service. The easiest way is to run migrations from the `admin-api` service which has access to the database via `DATABASE_URL`.

**Method 1: Via admin-api Service (Recommended - Easiest)**

1. **Go to Railway Dashboard** → `admin-api` → **Deployments**
2. Click on **latest active deployment** (green checkmark)
3. Click **"Run Command"** or **"Shell"**
4. Run:

   ```bash
   cd /app
   npx prisma migrate deploy
   ```

   **Note:** This works because `admin-api` has `DATABASE_URL` environment variable pointing to the Postgres service.

   **Expected output:**

   ```
   Applying migration `20241206120000_add_refresh_token_security`

   The following migration(s) have been applied:
     migrations/
       └─ 20241206120000_add_refresh_token_security/
         └─ migration.sql

   Your database is now in sync with your schema.
   ```

**Method 2: Run SQL Directly via Railway Connect (Recommended for Direct DB Access)**

Use the "Connect" button in Railway to run SQL directly:

1. **Go to Railway Dashboard** → `Postgres` service → **Database** tab
2. Click **"Connect"** button (purple button in top right)
3. You'll see connection options - use **"Railway CLI `connect` command"**:
   ```bash
   railway connect Postgres
   ```
4. **Run from your local terminal:**

   ```bash
   railway connect Postgres
   ```

   This opens an interactive psql session connected to your Railway database.

5. **Run the migration SQL:**
   - Copy the SQL from: `RAILWAY_MIGRATION_SQL.md`
   - Paste into the psql session
   - Press Enter to execute

**Alternative: Use Raw psql Command**

If you prefer using psql directly:

1. From the "Connect" modal, copy the **"Raw `psql` command"**
2. Run it from your local terminal
3. Paste and execute the SQL from `RAILWAY_MIGRATION_SQL.md`

**Method 3: Via Railway CLI**

```bash
# Make sure you're linked to the project
railway link

# Run migration (runs in Railway environment with correct DATABASE_URL)
railway run --service admin-api npx prisma migrate deploy
```

### **Step 2: Verify Migration**

**Via admin-api Service:**

1. Go to `admin-api` → Deployments → Latest deployment
2. Run Command:
   ```bash
   npx prisma migrate status
   ```

**Or check database directly:**

1. Go to `Postgres` service → **Data** tab
2. Check that `admin_refresh_tokens` table exists
3. Check that `refresh_tokens` table has `token_hash` column (not `token`)

---

## 🎯 Complete Deployment Order

1. ✅ **Fix Build Command** (this fixes the TypeScript error)
2. ✅ **Wait for Build to Succeed**
3. ✅ **Service Deploys and Starts**
4. ✅ **Run Database Migration** (creates tables)
5. ✅ **Verify Everything Works**

---

## ⚠️ Important Notes

- **Build Command:** Generates Prisma Client + Compiles TypeScript
- **Start Command:** Runs the compiled JavaScript
- **Migration:** Runs AFTER deployment (not during build!)
- **Schema File:** Must be in Git so Railway can access it

---

**After fixing the build command, the deployment should succeed!** 🚀
