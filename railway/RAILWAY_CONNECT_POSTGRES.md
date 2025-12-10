# Connect to Railway Postgres Database 🗄️

**Issue:** `psql must be installed to continue`

---

## ✅ Option 1: Add PostgreSQL to PATH (If Installed)

Since you have PostgreSQL installed at `D:\PostgreSQL\16\bin\psql.exe`, add it to PATH:

### **Step 1: Add to PATH (Windows)**

1. **Open System Environment Variables:**

   - Press `Win + R`
   - Type: `sysdm.cpl` and press Enter
   - Click **"Advanced"** tab
   - Click **"Environment Variables"**

2. **Edit PATH:**

   - Under **"System variables"**, find **"Path"**
   - Click **"Edit"**
   - Click **"New"**
   - Add: `D:\PostgreSQL\16\bin`
   - Click **"OK"** on all dialogs

3. **Restart Terminal:**

   - Close your current terminal/PowerShell
   - Open a new terminal
   - Test: `psql --version`

4. **Try Again:**
   ```bash
   railway connect postgres
   ```

---

## ✅ Option 2: Use Full Path (Quick Fix)

Instead of adding to PATH, use the full path directly:

```bash
# Set PATH for current session only
$env:Path += ";D:\PostgreSQL\16\bin"

# Then try Railway connect
railway connect postgres
```

Or use the full path in Railway command (if Railway supports it):

```bash
# Check if Railway can use custom psql path
railway connect postgres --psql "D:\PostgreSQL\16\bin\psql.exe"
```

---

## ✅ Option 3: Use Railway Dashboard (Easiest - Recommended)

**No installation needed!**

### **Step 1: Open Postgres Service**

1. Railway Dashboard
2. Click on **`Postgres`** service

### **Step 2: Open Database Tab**

1. Click **"Database"** tab (main tab, not "Settings")
2. You'll see sub-tabs: **"Data"**, "Extensions", "Credentials"
3. Click **"Data"** sub-tab

### **Step 3: Run SQL Query**

**Option A: If you see a query editor:**

1. Look for a query input box or "Query" button
2. Paste and run:

   ```sql
   ALTER TABLE "users"
   ADD COLUMN IF NOT EXISTS "address" TEXT,
   ADD COLUMN IF NOT EXISTS "weight" DOUBLE PRECISION;

   CREATE INDEX IF NOT EXISTS "users_display_name_idx" ON "users"("display_name");
   CREATE INDEX IF NOT EXISTS "users_deleted_at_idx" ON "users"("deleted_at");
   ```

**Option B: If you see tables list:**

1. Click on **`users`** table
2. Look for **"Query"** or **"SQL"** button
3. Run the SQL commands above

**Option C: Use Table Editor:**

1. Click on **`users`** table
2. Look for **"Add Column"** or **"Edit Schema"** option
3. Add columns manually:
   - `address` (TEXT, nullable)
   - `weight` (DOUBLE PRECISION, nullable)

---

## ✅ Option 4: Use pgAdmin or DBeaver

If you have a PostgreSQL GUI tool installed:

1. **Get Connection String:**

   - Railway Dashboard → Postgres → **"Database"** tab → **"Credentials"** sub-tab
   - Copy the connection string

2. **Connect with GUI Tool:**
   - Use the connection details to connect
   - Run SQL queries directly

---

## 🎯 Recommended: Use Dashboard Method

**Easiest and fastest:**

1. Railway Dashboard → `Postgres` service
2. **"Database"** tab → **"Data"** sub-tab
3. Find query editor or click on `users` table
4. Run SQL commands

**No installation or PATH configuration needed!** ✅

---

## 📋 SQL Commands to Run

Once you have access (Dashboard or CLI):

```sql
-- Add address and weight columns
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "address" TEXT,
ADD COLUMN IF NOT EXISTS "weight" DOUBLE PRECISION;

-- Add indexes
CREATE INDEX IF NOT EXISTS "users_display_name_idx" ON "users"("display_name");
CREATE INDEX IF NOT EXISTS "users_deleted_at_idx" ON "users"("deleted_at");
```

---

## ✅ Verify After Running

```sql
-- Check columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('address', 'weight');
```

Should return:

- `address` (text)
- `weight` (double precision)

---

**Use the Dashboard method - it's the easiest!** 🚀
