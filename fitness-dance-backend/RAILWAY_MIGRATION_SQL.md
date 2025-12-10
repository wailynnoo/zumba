# Railway Migration SQL - Run Directly in Postgres

**Migration:** `20241206120000_add_refresh_token_security`

**Purpose:** Create `admin_refresh_tokens` table and update `refresh_tokens` table

---

## 🚀 How to Run

### **⚠️ Recommended: Run Migration via admin-api Service**

Since the database is separate, the easiest way is to run the migration from `admin-api` service which has `DATABASE_URL`:

1. **Go to Railway Dashboard** → `admin-api` service → **Deployments**
2. Click on **latest active deployment** (green checkmark)
3. Click **"Run Command"** or **"Shell"**
4. Run:
   ```bash
   cd /app
   npx prisma migrate deploy
   ```

This will apply the migration automatically using Prisma Migrate.

---

## 🔧 Alternative: Run SQL Directly (If You Have psql Installed)

If you prefer to run SQL directly and have `psql` installed:

### **Step 1: Open Postgres Service**

1. Go to Railway Dashboard
2. Select your project: `fitness-dance-backend`
3. Click on **`Postgres`** service (NOT admin-api)

### **Step 2: Get Connection Details**

1. Click **"Database"** tab (main tab)
2. Click **"Connect"** button (purple button in top right)
3. A modal will open showing connection options

### **Step 3: Connect to Database**

**Option A: Railway CLI Connect (May Not Work - Use Option B)**

1. From the "Connect to Postgres" modal, copy the **"Railway CLI `connect` command"**:

   ```
   railway connect Postgres
   ```

2. **Run from your local terminal:**

   ```bash
   railway connect Postgres
   ```

   This opens an interactive psql session connected to your Railway database.

3. **Run the migration SQL:**
   - Copy the SQL below (starting from `-- CreateTable: admin_refresh_tokens`)
   - Paste into the psql session
   - Press Enter to execute

**Option B: Raw psql Command (Alternative)**

1. From the "Connect to Postgres" modal, copy the **"Raw `psql` command"**

   - It will look like: `PGPASSWORD=******** psql -h nozomi.proxy.rlwy.net -U postgres -p 56096 -d railway`
   - Click "show" to reveal the password

2. **Run from your local terminal:**

   ```bash
   # Replace with your actual connection details from Railway
   PGPASSWORD=your_password psql -h nozomi.proxy.rlwy.net -U postgres -p 56096 -d railway
   ```

3. **Run the migration SQL:**
   - Copy the SQL below
   - Paste into the psql session
   - Press Enter to execute

---

## 📋 Migration SQL

Copy and paste this SQL into your psql session:

```sql
-- CreateTable: admin_refresh_tokens
CREATE TABLE "admin_refresh_tokens"
(
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMP(3),
    "device_info" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: admin_refresh_tokens_token_hash
CREATE UNIQUE INDEX "admin_refresh_tokens_token_hash_key" ON "admin_refresh_tokens"("token_hash");

-- CreateIndex: admin_refresh_tokens_admin_id
CREATE INDEX "admin_refresh_tokens_admin_id_idx" ON "admin_refresh_tokens"("admin_id");

-- CreateIndex: admin_refresh_tokens_token_hash_idx
CREATE INDEX "admin_refresh_tokens_token_hash_idx" ON "admin_refresh_tokens"("token_hash");

-- CreateIndex: admin_refresh_tokens_expires_at_idx
CREATE INDEX "admin_refresh_tokens_expires_at_idx" ON "admin_refresh_tokens"("expires_at");

-- CreateIndex: admin_refresh_tokens_is_revoked_idx
CREATE INDEX "admin_refresh_tokens_is_revoked_idx" ON "admin_refresh_tokens"("is_revoked");

-- AddForeignKey: admin_refresh_tokens_admin_id_fkey
ALTER TABLE "admin_refresh_tokens" ADD CONSTRAINT "admin_refresh_tokens_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: refresh_tokens - Rename token to token_hash
-- First, drop the old unique constraint and index
DROP INDEX IF EXISTS "refresh_tokens_token_key";
DROP INDEX IF EXISTS "refresh_tokens_token_idx";

-- Rename the column
ALTER TABLE "refresh_tokens" RENAME COLUMN "token" TO "token_hash";

-- Recreate unique constraint and index with new name
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- AddColumn: refresh_tokens - Add user_agent column
ALTER TABLE "refresh_tokens" ADD COLUMN "user_agent" TEXT;

-- CreateIndex: refresh_tokens_is_revoked (if it doesn't exist)
CREATE INDEX
IF NOT EXISTS "refresh_tokens_is_revoked_idx" ON "refresh_tokens"
("is_revoked");
```

---

## ✅ Verification

After running the SQL, verify:

**Option 1: Via Railway Data Tab**

1. Go to Railway Dashboard → `Postgres` service → **Database** tab → **Data** sub-tab
2. Check the tables list - you should see `admin_refresh_tokens` table
3. Click on `refresh_tokens` table to verify it has `token_hash` column (not `token`)

**Option 2: Via psql Session**

Run these queries in your psql session:

```sql
-- Check admin_refresh_tokens table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'admin_refresh_tokens';

-- Check refresh_tokens has token_hash column
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'refresh_tokens'
AND column_name = 'token_hash';

-- Check foreign key exists
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'admin_refresh_tokens'
AND constraint_type = 'FOREIGN KEY';
```

---

## ⚠️ Important Notes

- **Safe to run multiple times:** The SQL uses `IF NOT EXISTS` and `IF EXISTS` where appropriate
- **No data loss:** This migration only adds new table and renames a column
- **Backup:** Railway automatically backs up your database, but you can create manual backups via Dashboard → Postgres → Backups
- **Connection:** Use the "Connect" button in Railway Dashboard to get the correct connection details

---

**After running this SQL, your database will be updated!** ✅
