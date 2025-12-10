# Fix Railway Migration "No migration found" Error 🔧

**Problem:** Railway logs show:

```
No migration found in prisma/migrations
No pending migrations to apply.
```

**Root Cause:** The migration command is running from the wrong directory or the `prisma/migrations` folder isn't being deployed.

---

## ✅ Solution: Fix Start Command

Since Railway deploys from the **root directory** (not just `admin-api`), we need to ensure the migration command runs from the correct location.

### **Step 1: Update Custom Start Command in Railway**

1. **Go to Railway Dashboard** → `admin-api` service → **Settings** → **Deploy** tab

2. **Update "Custom Start Command"** to:

   ```bash
   cd admin-api && npm run migrate:deploy && npm start
   ```

   **OR** (if Railway's root is set to the project root):

   ```bash
   npx prisma migrate deploy --schema=prisma/schema.prisma && cd admin-api && npm start
   ```

3. **Save** - Railway will redeploy

---

## 🔍 Verify Railway Root Directory

**Check what Railway's root directory is set to:**

1. Go to `admin-api` service → **Settings** → **Source** tab
2. Look for **"Root Directory"** field
3. It should be either:
   - **Empty or `/`** = Root of repository (`fitness-dance-backend/`)
   - **`admin-api`** = Only `admin-api/` folder

### **If Root Directory is `/` (root):**

**Update Start Command to:**

```bash
npx prisma migrate deploy --schema=prisma/schema.prisma && cd admin-api && npm start
```

### **If Root Directory is `admin-api`:**

**Update Start Command to:**

```bash
npm run migrate:deploy && npm start
```

And update `package.json` script to:

```json
"migrate:deploy": "cd .. && npx prisma migrate deploy --schema=prisma/schema.prisma"
```

---

## 🎯 Recommended: Use Absolute Path

**Best solution - works regardless of root directory:**

1. **Update Start Command:**

   ```bash
   npx prisma migrate deploy --schema=./prisma/schema.prisma && cd admin-api && npm start
   ```

2. **Or if Railway root is `admin-api`:**
   ```bash
   cd .. && npx prisma migrate deploy --schema=prisma/schema.prisma && cd admin-api && npm start
   ```

---

## 🔍 Debug: Check What Files Are Deployed

**To verify the `prisma/migrations` folder is deployed:**

1. **Check Railway Logs** during build - look for:

   ```
   Uploading files...
   ```

2. **Or add a debug command** to your start command temporarily:

   ```bash
   ls -la prisma/migrations && cd admin-api && npm start
   ```

3. **Check if migrations exist:**
   ```bash
   find . -name "migration.sql" -type f
   ```

---

## ✅ Alternative: Copy Migrations to admin-api

If Railway only deploys `admin-api` folder:

1. **Copy migrations to admin-api:**

   ```bash
   mkdir -p admin-api/prisma/migrations
   cp -r prisma/migrations/* admin-api/prisma/migrations/
   ```

2. **Update schema path:**

   - Move `prisma/schema.prisma` to `admin-api/prisma/schema.prisma`
   - Or update all Prisma commands to use `../prisma/schema.prisma`

3. **Update start command:**
   ```bash
   cd admin-api && npx prisma migrate deploy && npm start
   ```

---

## 🎯 Quick Fix (Try This First)

**Update Railway Start Command to:**

```bash
pwd && ls -la && ls -la prisma/migrations 2>&1 || echo "prisma/migrations not found" && cd admin-api && npm run migrate:deploy && npm start
```

This will:

1. Show current directory
2. List files
3. Check if `prisma/migrations` exists
4. Run migration
5. Start the app

**Check the logs** to see what directory Railway is running from and whether the migrations folder exists.

---

## 📋 Expected Log Output (Success)

After fixing, you should see:

```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "railway", schema "public" at "postgres.railway.internal:5432"

Applying migration `20241206120000_add_refresh_token_security`

The following migration(s) have been applied:
  migrations/
    └─ 20241206120000_add_refresh_token_security/
      └─ migration.sql

Your database is now in sync with your schema.
```

---

**✅ Check Railway's Root Directory setting first, then update the start command accordingly!**
