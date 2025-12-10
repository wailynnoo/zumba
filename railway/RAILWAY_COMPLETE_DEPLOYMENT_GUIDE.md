# Complete Railway Deployment Guide 🚀

**Verified folder structure and deployment settings for both services**

---

## 📁 Project Structure

```
fitness-dance-backend/              # Root directory (deploy this)
├── admin-api/                      # Admin API service
│   ├── src/                        # TypeScript source
│   ├── dist/                       # Compiled JavaScript (generated)
│   ├── package.json                # Dependencies & scripts
│   └── tsconfig.json               # TypeScript config
├── member-api/                     # Member API service
│   ├── src/                        # TypeScript source
│   ├── dist/                       # Compiled JavaScript (generated)
│   ├── package.json                # Dependencies & scripts
│   └── tsconfig.json               # TypeScript config
├── prisma/                         # Shared Prisma schema
│   ├── schema.prisma               # Database schema
│   ├── migrations/                 # Database migrations
│   └── seed.ts                     # Seed data script
├── package.json                    # Root dependencies
└── prisma.config.ts                # Prisma 7 config
```

**Key Points:**
- ✅ Both services are in separate folders
- ✅ Prisma schema is in root `prisma/` folder
- ✅ Both services compile TypeScript to `dist/` folder
- ✅ Both use `npm start` which runs `node dist/index.js`

---

## 🎯 Admin API Deployment Settings

### **Service Name:** `admin-api`

### **Build Command:**
```
cd admin-api && npm install && cd .. && npx prisma generate && cd admin-api && npm run build
```

**What it does:**
1. `cd admin-api` - Go to admin-api folder
2. `npm install` - Install dependencies
3. `cd ..` - Go back to root (where prisma/ is)
4. `npx prisma generate` - Generate Prisma Client
5. `cd admin-api` - Go back to admin-api
6. `npm run build` - Compile TypeScript to JavaScript

### **Start Command:**
```
cd admin-api && npm start
```

**What it does:**
1. `cd admin-api` - Go to admin-api folder
2. `npm start` - Runs `node dist/index.js`

### **Environment Variables:**
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-secret>
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=production
CORS_ORIGIN=*
PORT=3002
```

---

## 🎯 Member API Deployment Settings

### **Service Name:** `member-api`

### **Build Command (COMPLETE - Fix the truncated one!):**
```
cd member-api && npm install && cd .. && npx prisma generate && cd member-api && npm run build
```

**⚠️ IMPORTANT:** Your image shows it's truncated to `&& c` - it should be the FULL command above!

**What it does:**
1. `cd member-api` - Go to member-api folder
2. `npm install` - Install dependencies
3. `cd ..` - Go back to root (where prisma/ is)
4. `npx prisma generate` - Generate Prisma Client
5. `cd member-api` - Go back to member-api
6. `npm run build` - Compile TypeScript to JavaScript

### **Start Command:**
```
cd member-api && npm start
```

**✅ This is correct in your image!**

**What it does:**
1. `cd member-api` - Go to member-api folder
2. `npm start` - Runs `node dist/index.js`

### **Environment Variables:**
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=uCJ9GYG4ml/Cl1BYA33RnuUaC4Uyb2HxX+qMfRcVl2s=
JWT_REFRESH_SECRET=k7CtgJSGBk1Emnu9b3bTkzh1WnjbeSBJC+r/aFt5Mj0=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=production
CORS_ORIGIN=*
PORT=3001
```

---

## 🚨 Issues Found in Your Images

### **Issue 1: Build Command Truncated** ❌

**Current (WRONG):**
```
cd member-api && npm install && cd .. && npx prisma generate && c
```

**Should be (CORRECT):**
```
cd member-api && npm install && cd .. && npx prisma generate && cd member-api && npm run build
```

**Fix:**
1. Railway Dashboard → `member-api` → Settings → Build
2. Delete the truncated command
3. Paste the complete command above
4. Save

### **Issue 2: Postgres Crashed** ❌

**Status:** Postgres shows "Crashed 2 minutes ago" (red flame icon)

**Fix:**
1. Railway Dashboard → `Postgres` service
2. Click "Deployments" tab
3. Check logs to see why it crashed
4. Try restarting the service
5. If it keeps crashing, check:
   - Database credentials
   - Resource limits
   - Connection issues

---

## ✅ Step-by-Step Fix for Member API

### **Step 1: Fix Build Command**

1. Railway Dashboard → `member-api` service
2. Click **"Settings"** tab
3. Click **"Build"** link (right sidebar)
4. Find **"Custom Build Command"** field
5. **Delete** the truncated command: `cd member-api && npm install && cd .. && npx prisma generate && c`
6. **Paste** the complete command:
   ```
   cd member-api && npm install && cd .. && npx prisma generate && cd member-api && npm run build
   ```
7. **Save** (or wait for auto-save)

### **Step 2: Verify Start Command**

1. Still in `member-api` → Settings
2. Click **"Deploy"** link (right sidebar)
3. Verify **"Custom Start Command"** shows:
   ```
   cd member-api && npm start
   ```
4. **✅ This is already correct!**

### **Step 3: Fix Postgres (If Still Crashed)**

1. Railway Dashboard → `Postgres` service
2. Click **"Deployments"** tab
3. Check latest deployment logs
4. If crashed, try:
   - Click **"Redeploy"** button
   - Or restart the service

### **Step 4: Redeploy Member API**

1. Railway Dashboard → `member-api` service
2. Click **"Deployments"** tab
3. Click **"Redeploy"** button
4. Wait for deployment to complete
5. Check logs - should show:
   - ✅ Build command running
   - ✅ Prisma Client generated
   - ✅ TypeScript compiled
   - ✅ Server starting: `🚀 Member API server running on port 3001`

---

## 📋 Verification Checklist

### **Admin API:**
- [ ] Build Command: `cd admin-api && npm install && cd .. && npx prisma generate && cd admin-api && npm run build`
- [ ] Start Command: `cd admin-api && npm start`
- [ ] Environment variables set (8 variables)
- [ ] Service status: "Online" (green)

### **Member API:**
- [ ] Build Command: `cd member-api && npm install && cd .. && npx prisma generate && cd member-api && npm run build` (COMPLETE, not truncated!)
- [ ] Start Command: `cd member-api && npm start`
- [ ] Environment variables set (8 variables)
- [ ] Service status: "Online" (green)

### **Postgres:**
- [ ] Service status: "Online" (green, not crashed)
- [ ] Database accessible from both services

---

## 🔍 How to Verify Commands Are Set

### **In Railway Dashboard:**

1. **Admin API:**
   - Settings → Build → Check "Custom Build Command"
   - Settings → Deploy → Check "Custom Start Command"

2. **Member API:**
   - Settings → Build → Check "Custom Build Command" (should be COMPLETE)
   - Settings → Deploy → Check "Custom Start Command"

**If commands are empty or truncated:** Railway will use auto-detection (which causes errors!)

---

## 🚀 Deployment Process

### **Initial Deployment:**

1. **Set up Postgres:**
   - Railway Dashboard → New → Database → PostgreSQL
   - Wait for it to be "Online"

2. **Deploy Admin API:**
   - Create service: `admin-api`
   - Set build command
   - Set start command
   - Set environment variables
   - Deploy

3. **Deploy Member API:**
   - Create service: `member-api`
   - Set build command (COMPLETE!)
   - Set start command
   - Set environment variables
   - Deploy

4. **Run Migrations:**
   - Connect to Postgres via Railway Dashboard
   - Run SQL commands or use Railway Shell

### **Update Deployment:**

```bash
# Make code changes locally
# Then deploy:
cd D:\Zumba\fitness-dance-backend
railway up
```

Railway will detect which service changed and redeploy it.

---

## 🎯 Quick Fix Summary

**For Member API (from your images):**

1. ✅ Start Command is correct: `cd member-api && npm start`
2. ❌ Build Command is truncated - fix it!
3. ❌ Postgres is crashed - restart it

**Fix these two issues and redeploy!** 🚀

---

## 📝 Complete Commands Reference

### **Admin API:**
- **Build:** `cd admin-api && npm install && cd .. && npx prisma generate && cd admin-api && npm run build`
- **Start:** `cd admin-api && npm start`

### **Member API:**
- **Build:** `cd member-api && npm install && cd .. && npx prisma generate && cd member-api && npm run build`
- **Start:** `cd member-api && npm start`

**Both services share the same database and Prisma schema!** ✅

---

**Fix the truncated build command and restart Postgres, then redeploy!** 🎯

