# SQL Commands for Railway Postgres 🗄️

**You're now connected to Railway Postgres!**

---

## ✅ Run These SQL Commands

Copy and paste these commands one by one in the `psql` prompt:

### **Step 1: Add Address and Weight Columns**

```sql
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "address" TEXT,
ADD COLUMN IF NOT EXISTS "weight" DOUBLE PRECISION;
```

### **Step 2: Add Indexes**

```sql
CREATE INDEX IF NOT EXISTS "users_display_name_idx" ON "users"("display_name");
CREATE INDEX IF NOT EXISTS "users_deleted_at_idx" ON "users"("deleted_at");
```

---

## ✅ Verify Migrations Applied

After running the commands, verify:

```sql
-- Check columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('address', 'weight');
```

**Should return:**

- `address` (text)
- `weight` (double precision)

**Check indexes:**

```sql
SELECT indexname
FROM pg_indexes
WHERE tablename = 'users'
AND indexname IN ('users_display_name_idx', 'users_deleted_at_idx');
```

**Should return both indexes.**

---

## 🎯 Quick Steps

1. ✅ You're connected to Railway Postgres (in psql prompt)
2. ✅ Copy and paste the ALTER TABLE command
3. ✅ Press Enter
4. ✅ Copy and paste the CREATE INDEX commands
5. ✅ Press Enter
6. ✅ Run the verification queries
7. ✅ Type `\q` to exit psql

---

## 📋 All Commands in One Block

If you want to run all at once:

```sql
-- Add columns
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "address" TEXT,
ADD COLUMN IF NOT EXISTS "weight" DOUBLE PRECISION;

-- Add indexes
CREATE INDEX IF NOT EXISTS "users_display_name_idx" ON "users"("display_name");
CREATE INDEX IF NOT EXISTS "users_deleted_at_idx" ON "users"("deleted_at");

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('address', 'weight');
```

---

**Run these commands in your psql prompt now!** 🚀
