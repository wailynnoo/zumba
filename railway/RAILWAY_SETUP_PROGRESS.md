# Railway Setup Progress ✅

**Current Status:** Railway project initialized!

---

## ✅ Completed Steps

1. ✅ Railway CLI installed (`railway 4.12.0`)
2. ✅ Logged in to Railway (wailynnoo81@gmail.com)
3. ✅ Project initialized: `fitness-dance-backend`

---

## 📋 Next Steps

### **Step 1: Add PostgreSQL Database**

**Option A: Using Railway Dashboard (Recommended)**

1. Go to: https://railway.app/dashboard
2. Open your project: `fitness-dance-backend`
3. Click "New" → "Database" → "Add PostgreSQL"
4. Wait 1-2 minutes for database to be created
5. Railway automatically creates `DATABASE_URL` environment variable

**Option B: Using CLI**

```bash
railway add postgresql
```

---

### **Step 2: Create Admin API Service**

**In Railway Dashboard:**

1. In your project, click "New" → "Empty Service"
2. Name it: `admin-api`
3. Click "Create"

---

### **Step 3: Configure Service Settings**

**In Railway Dashboard → admin-api service → Settings:**

1. **Root Directory:** Leave empty (or set to `.`)

2. **Build Command:**

   ```bash
   cd admin-api && npm install && npm run build && cd .. && npx prisma generate
   ```

3. **Start Command:**
   ```bash
   cd admin-api && npm start
   ```

---

### **Step 4: Set Environment Variables**

**In Railway Dashboard → admin-api → Variables tab:**

Add these variables:

```env
# Database (Auto-injected - use this format)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Secrets (Generate strong secrets!)
JWT_SECRET=GENERATE_THIS_32_CHARS_MIN
JWT_REFRESH_SECRET=GENERATE_THIS_32_CHARS_MIN

# JWT Expiration
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d

# Server
NODE_ENV=production
CORS_ORIGIN=*

# Port (Railway sets this automatically, but good to have)
PORT=3002
```

**Generate JWT Secrets:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Run this twice to get two different secrets.

---

### **Step 5: Deploy Code**

```bash
cd D:\Zumba\fitness-dance-backend
railway up
```

---

### **Step 6: Run Database Migrations**

```bash
railway run npx prisma migrate deploy
```

---

### **Step 7: Seed Initial Data (Optional)**

```bash
railway run npm run seed
```

---

### **Step 8: Get Your API URL**

**In Railway Dashboard:**

1. Go to `admin-api` service
2. Click "Settings" → "Generate Domain"
3. Railway provides: `your-app-name.up.railway.app`
4. Copy this URL

---

### **Step 9: Test Deployment**

```bash
# Health check
curl https://your-app-name.up.railway.app/health

# Test login
curl -X POST https://your-app-name.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zfitdance.com", "password": "Admin@123"}'
```

---

## 🎯 Current Status

- ✅ Railway CLI installed
- ✅ Logged in
- ✅ Project created: `fitness-dance-backend`
- ⏳ Next: Add database in Railway Dashboard

---

## 💡 Quick Tips

1. **Use Railway Dashboard** for database and service creation (easier than CLI)
2. **Generate JWT secrets** before setting environment variables
3. **Test locally first** before deploying
4. **Check logs** in Railway dashboard if deployment fails

---

**Ready for next steps!** 🚀

Go to Railway Dashboard and add the database, then we'll continue!
