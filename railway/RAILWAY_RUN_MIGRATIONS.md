# Run Database Migrations on Railway 🗄️

**Migrations must run inside Railway, not from your local machine.**

---

## ✅ Method 1: Using Railway Dashboard (Easiest)

### **Step 1: Open Railway Dashboard**

1. Go to: https://railway.app/dashboard
2. Open your project: `fitness-dance-backend`
3. Click on `admin-api` service

### **Step 2: Run Migration Command**

1. Click **"Deployments"** tab
2. Click on the **latest (active) deployment** (green box)
3. Click **"Run Command"** button
4. Enter command:
   ```
   npx prisma migrate deploy
   ```
5. Click **"Run"**

### **Step 3: Check Results**

- You'll see the migration output in the logs
- Should see: "Applied migration: ..."
- All tables will be created!

---

## ✅ Method 2: Using Railway CLI (Alternative)

**Note:** This runs the command in Railway's environment, not locally.

```bash
# Make sure you're in the project root
cd D:\Zumba\fitness-dance-backend

# Run migration in Railway environment
railway run --service admin-api npx prisma migrate deploy
```

**If this doesn't work, use Method 1 (Dashboard) instead.**

---

## 🌱 Step 4: Seed Initial Data (Optional)

**After migrations succeed, seed the database:**

**In Railway Dashboard:**

1. Go to `admin-api` service
2. Click "Deployments" → Latest → "Run Command"
3. Enter: `npm run seed`
4. Click "Run"

**This creates:**

- ✅ Dance styles (5)
- ✅ Intensity levels (2)
- ✅ Video categories (3)
- ✅ Subscription plans (4)
- ✅ Admin roles (4)
- ✅ Super Admin account:
  - Email: `admin@zfitdance.com`
  - Password: `Admin@123`

---

## ✅ Verification

**After migrations and seed:**

1. **Check Railway Logs:**

   - Should see "Migration applied" messages
   - Should see "Seed completed" message

2. **Test API:**
   - Get your API URL from Railway Dashboard
   - Test health endpoint
   - Test login with admin credentials

---

## 🎯 Quick Steps Summary

1. ✅ Go to Railway Dashboard
2. ✅ Click `admin-api` service
3. ✅ Click "Deployments" → Latest → "Run Command"
4. ✅ Enter: `npx prisma migrate deploy`
5. ✅ Click "Run"
6. ✅ Wait for success message
7. ✅ (Optional) Run: `npm run seed`

---

**Use the Dashboard method - it's the easiest!** 🚀
