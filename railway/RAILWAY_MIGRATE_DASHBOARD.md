# Run Migrations via Railway Dashboard 🚀

**The `railway run` command can't access the internal database URL from your local machine. Use the Dashboard instead!**

---

## ✅ Solution: Use Railway Dashboard

### **Step 1: Open Railway Dashboard**

1. Go to: https://railway.app/dashboard
2. Select your project: `fitness-dance-backend`
3. Click on the **`admin-api`** service (NOT Postgres)

---

### **Step 2: Run Migration Command**

1. Click on the **"Deployments"** tab
2. Click on the **latest (active) deployment** (green box with checkmark)
3. Look for **"Run Command"** button (usually at the top right)
4. Click **"Run Command"**
5. In the command input, enter:
   ```
   npx prisma migrate deploy
   ```
6. Click **"Run"** or press Enter

---

### **Step 3: Check Results**

You'll see the migration output in the logs:

**Success output:**
```
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "railway", schema "public" at "postgres.railway.internal:5432"

Applying migration `20251206104608_add_user_address_weight`
Applying migration `20251206120706_add_user_indexes`

The following migration(s) have been applied:
  migrations/
    └─ 20251206104608_add_user_address_weight/
      └─ migration.sql
  migrations/
    └─ 20251206120706_add_user_indexes/
      └─ migration.sql

Your database is now in sync with your schema.
```

---

## 🎯 Why Dashboard Works Better

**The Dashboard method:**
- ✅ Runs commands **inside Railway's environment**
- ✅ Has access to internal database URL (`postgres.railway.internal:5432`)
- ✅ Uses Railway's environment variables automatically
- ✅ No local `.env` file conflicts

**The `railway run` method:**
- ❌ Tries to use local `.env` file
- ❌ Can't access internal Railway network from your machine
- ❌ Database URL is internal-only

---

## 📋 Alternative: Use Postgres Service

If you want to run from the Postgres service instead:

1. Click on **`Postgres`** service (not admin-api)
2. Click **"Deployments"** tab
3. Click latest deployment
4. Click **"Run Command"**
5. Enter: `npx prisma migrate deploy`
6. Click **"Run"**

**Note:** You might need to navigate to the project root first:
```
cd /app && npx prisma migrate deploy
```

---

## 🔍 Verify Migrations Applied

**After running migrations, verify:**

1. **Check Migration Status:**
   - In Railway Dashboard → admin-api → Run Command
   - Enter: `npx prisma migrate status`
   - Should show: "Database schema is up to date!"

2. **Check Columns Exist:**
   - Go to Postgres service → Data tab
   - Run query:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'users' 
   AND column_name IN ('address', 'weight');
   ```
   - Should return both `address` and `weight`

---

## 🎯 Quick Steps Summary

1. ✅ Go to Railway Dashboard
2. ✅ Click `admin-api` service
3. ✅ Click "Deployments" → Latest deployment
4. ✅ Click "Run Command"
5. ✅ Enter: `npx prisma migrate deploy`
6. ✅ Click "Run"
7. ✅ Check logs for success

---

## 💡 Pro Tip

**If "Run Command" button is not visible:**
- Make sure you're on the **latest active deployment**
- Try clicking on the deployment card/box
- Look for a terminal/command icon
- Some Railway interfaces have it in the top toolbar

---

**Use the Dashboard - it's the most reliable method!** 🚀

