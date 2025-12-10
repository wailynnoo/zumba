# Update Database to Railway Server 🔄

**How to apply local database changes to Railway production database**

---

## 📋 What Migrations Need to Be Applied

**New migrations created locally:**
1. ✅ `20251206104608_add_user_address_weight` - Added address and weight columns
2. ✅ `20251206120706_add_user_indexes` - Added displayName and deletedAt indexes

---

## 🚀 Method 1: Railway Dashboard (Recommended)

### **Step 1: Open Railway Dashboard**
1. Go to https://railway.app/dashboard
2. Select your project: `fitness-dance-backend`
3. Click on the **Postgres** service

### **Step 2: Run Migrations**
1. Click on the **"Data"** tab (or **"Query"** tab)
2. Click **"Run Command"** or **"New Query"**
3. Run this command:
   ```bash
   npx prisma migrate deploy
   ```

**OR use the terminal:**
1. Click on **"Deployments"** tab
2. Click **"Run Command"**
3. Select **Postgres** service
4. Enter command: `npx prisma migrate deploy`
5. Click **"Run"**

---

## 🚀 Method 2: Railway CLI (From Local Machine)

### **Step 1: Link to Railway Project**
```bash
cd fitness-dance-backend
railway link
```
Select your project when prompted.

### **Step 2: Set Database URL**
```bash
railway variables
```
Make sure `DATABASE_URL` is set (should be `${{Postgres.DATABASE_URL}}`)

### **Step 3: Run Migrations**
```bash
railway run --service Postgres npx prisma migrate deploy
```

**Note:** This runs migrations on the Railway database using the Railway internal network.

---

## 🚀 Method 3: Manual SQL (If Needed)

If migrations fail, you can run SQL manually:

### **Migration 1: Add Address and Weight**
```sql
ALTER TABLE "users" 
ADD COLUMN "address" TEXT,
ADD COLUMN "weight" DOUBLE PRECISION;
```

### **Migration 2: Add Indexes**
```sql
CREATE INDEX "users_display_name_idx" ON "users"("display_name");
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");
```

**In Railway Dashboard:**
1. Go to Postgres service
2. Click **"Data"** or **"Query"** tab
3. Paste SQL and run

---

## ✅ Verification Steps

### **Step 1: Check Migration Status**
```bash
railway run --service Postgres npx prisma migrate status
```

**Expected output:**
```
Database schema is up to date!
```

### **Step 2: Verify Columns Exist**
Run this query in Railway Dashboard:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('address', 'weight');
```

**Expected:** Should show `address` (text) and `weight` (double precision)

### **Step 3: Verify Indexes Exist**
```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'users' 
AND indexname IN ('users_display_name_idx', 'users_deleted_at_idx');
```

**Expected:** Should show both indexes

---

## 🔧 Troubleshooting

### **Issue 1: "Migration already applied"**
**Solution:** This is fine! It means the migration was already applied.

### **Issue 2: "Can't reach database server"**
**Solution:** 
- Make sure you're running from Railway Dashboard or using `railway run`
- Don't run migrations locally with Railway DATABASE_URL

### **Issue 3: "Migration not found"**
**Solution:**
- Make sure all migration files are in `prisma/migrations/`
- Check that migration files are committed to your codebase
- Redeploy your service to ensure migration files are uploaded

### **Issue 4: "Column already exists"**
**Solution:**
- The column already exists, which is fine
- You can skip this migration or mark it as applied

---

## 📝 Step-by-Step Guide (Recommended)

### **Option A: Using Railway Dashboard**

1. **Go to Railway Dashboard**
   - https://railway.app/dashboard
   - Select `fitness-dance-backend` project

2. **Open Postgres Service**
   - Click on **Postgres** service

3. **Run Migrations**
   - Click **"Deployments"** tab
   - Click **"Run Command"**
   - Select **Postgres** service
   - Command: `npx prisma migrate deploy`
   - Click **"Run"**

4. **Verify**
   - Check logs for success message
   - Run verification queries above

---

### **Option B: Using Railway CLI**

1. **Link Project** (if not already linked)
   ```bash
   cd fitness-dance-backend
   railway link
   ```

2. **Run Migrations**
   ```bash
   railway run --service Postgres npx prisma migrate deploy
   ```

3. **Verify**
   ```bash
   railway run --service Postgres npx prisma migrate status
   ```

---

## 🎯 Quick Command Reference

```bash
# Link to Railway project
railway link

# Run migrations on Railway
railway run --service Postgres npx prisma migrate deploy

# Check migration status
railway run --service Postgres npx prisma migrate status

# View Railway logs
railway logs --service Postgres
```

---

## ✅ After Migrations Are Applied

1. ✅ Database schema matches local schema
2. ✅ `address` and `weight` columns exist
3. ✅ Indexes are created
4. ✅ API can use new fields
5. ✅ Registration/login will work with new fields

---

## 🔐 Important Notes

1. **Backup First:** Railway automatically backs up your database, but it's good practice to verify

2. **Test Locally:** Make sure migrations work locally first:
   ```bash
   npx prisma migrate deploy
   ```

3. **Production Safety:** 
   - Migrations are safe (adding columns, indexes)
   - No data loss
   - Can be rolled back if needed

4. **Timing:** 
   - Migrations run quickly (seconds)
   - No downtime required
   - API continues working during migration

---

**Ready to update your Railway database!** 🚀

