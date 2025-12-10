# Railway Deployment Guide - Admin API + Database 🚂

**Complete guide for deploying admin-api and database on Railway**

---

## 🎯 Railway Setup Overview

**What we're deploying:**

- ✅ **PostgreSQL Database** - On Railway
- ✅ **Admin API** - On Railway (same project or separate)

**Why Railway?**

- ✅ Easy setup and deployment
- ✅ Auto-deploy from Git
- ✅ Integrated database service
- ✅ Simple environment variable management
- ✅ Good pricing ($5-10/month)
- ✅ Great for Node.js apps

---

## 📋 Pre-Deployment Checklist

### **Before Starting:**

- [ ] Railway account created (https://railway.app)
- [ ] GitHub repository ready (or Git repository)
- [ ] Code tested locally
- [ ] Environment variables list ready

---

## 🚀 Step-by-Step Deployment

### **Step 1: Create Railway Account & Project**

1. **Sign up for Railway:**

   - Go to https://railway.app
   - Sign up with GitHub (recommended) or email
   - Verify your account

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo" (recommended)
   - Or "Empty Project" if uploading manually

---

### **Step 2: Add PostgreSQL Database**

1. **In Railway Dashboard:**

   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will automatically create a PostgreSQL database
   - Wait 1-2 minutes for setup

2. **Get Database Connection String:**

   - Click on the PostgreSQL service
   - Go to "Variables" tab
   - Copy the `DATABASE_URL` value
   - **Format:** `postgresql://postgres:PASSWORD@HOST:PORT/railway`

3. **Note the Connection Details:**
   - Railway automatically creates `DATABASE_URL` environment variable
   - This will be available to your API service

---

### **Step 3: Deploy Admin API**

#### **Option A: Deploy from GitHub (Recommended)**

1. **Connect Repository:**

   - In Railway project, click "New" → "GitHub Repo"
   - Select your repository
   - Railway will detect it's a Node.js project

2. **Configure Service:**

   - **Root Directory:** Set to `admin-api` (important!)
   - Railway will auto-detect `package.json`

3. **Build Settings:**

   - Railway will auto-detect build commands
   - If needed, add custom build command:
     ```
     npm install && npm run build && cd .. && npx prisma generate
     ```

4. **Start Command:**
   - Railway will auto-detect: `npm start`
   - This runs `node dist/index.js`

#### **Option B: Deploy from Local Code**

1. **Install Railway CLI:**

   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Initialize Railway:**

   ```bash
   cd fitness-dance-backend/admin-api
   railway init
   ```

3. **Link to Project:**

   - Select your Railway project
   - Or create new project

4. **Deploy:**
   ```bash
   railway up
   ```

---

### **Step 4: Configure Environment Variables**

**In Railway Dashboard:**

1. **Go to Admin API Service:**

   - Click on your API service
   - Go to "Variables" tab

2. **Add Required Variables:**

   ```env
   # Database (Auto-injected if database is in same project)
   DATABASE_URL=${{Postgres.DATABASE_URL}}

   # Or manually set if database is separate:
   # DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/railway

   # JWT Configuration (REQUIRED - Generate strong secrets!)
   JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
   JWT_REFRESH_SECRET=your-refresh-token-secret-min-32-characters-long
   JWT_EXPIRES_IN=30m
   JWT_REFRESH_EXPIRES_IN=7d

   # Server Configuration
   PORT=3002
   NODE_ENV=production

   # CORS Configuration
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

3. **Generate JWT Secrets:**

   ```bash
   # Generate random secret (32+ characters)
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

4. **Important Notes:**
   - Railway auto-injects `DATABASE_URL` if database is in same project
   - Use `${{Postgres.DATABASE_URL}}` to reference database service
   - Never commit secrets to Git!

---

### **Step 5: Handle Prisma Schema Location**

**Important:** Prisma schema is in parent directory, not in `admin-api/`

**Solution Options:**

#### **Option A: Deploy Entire Folder (Recommended)**

1. **Change Root Directory:**

   - In Railway service settings
   - Set Root Directory to: `fitness-dance-backend` (parent folder)

2. **Update Build Command:**

   ```
   cd admin-api && npm install && npm run build && cd .. && npx prisma generate
   ```

3. **Update Start Command:**
   ```
   cd admin-api && npm start
   ```

#### **Option B: Custom Build Script**

1. **Create `build.sh` in `admin-api/`:**

   ```bash
   #!/bin/bash
   npm install
   npm run build
   cd ..
   npx prisma generate
   cd admin-api
   ```

2. **In Railway:**
   - Build Command: `chmod +x build.sh && ./build.sh`
   - Start Command: `npm start`

#### **Option C: Add Prisma Scripts to package.json**

1. **Update `admin-api/package.json`:**

   ```json
   {
     "scripts": {
       "build": "tsc",
       "build:full": "npm run build && cd .. && npx prisma generate && cd admin-api",
       "start": "node dist/index.js"
     }
   }
   ```

2. **In Railway:**
   - Build Command: `npm run build:full`
   - Start Command: `npm start`

---

### **Step 6: Run Database Migrations**

**Before first deployment or after schema changes:**

1. **Using Railway CLI:**

   ```bash
   railway run npx prisma migrate deploy
   ```

2. **Or Add to Build Process:**

   - Add to build command:
     ```
     npm install && npm run build && cd .. && npx prisma generate && npx prisma migrate deploy && cd admin-api
     ```

3. **Or Manual Migration:**
   - Connect to Railway database
   - Run migrations manually

---

### **Step 7: Seed Initial Data (Optional)**

**If you need to seed data:**

1. **Using Railway CLI:**

   ```bash
   railway run npm run seed
   ```

2. **Or Add Seed Script:**
   - Add to `package.json`:
     ```json
     "scripts": {
       "seed": "cd .. && npx tsx prisma/seed.ts"
     }
     ```

---

### **Step 8: Configure Custom Domain (Optional)**

1. **In Railway Dashboard:**

   - Go to your API service
   - Click "Settings" → "Generate Domain"
   - Railway provides: `your-app.railway.app`

2. **Add Custom Domain:**

   - Click "Custom Domain"
   - Add your domain (e.g., `api.zfitdance.com`)
   - Follow DNS instructions

3. **SSL Certificate:**
   - Railway automatically provisions SSL
   - No additional setup needed

---

## 🔧 Railway-Specific Configuration

### **railway.json (Optional)**

Create `railway.json` in `admin-api/` for advanced configuration:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build && cd .. && npx prisma generate"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## ✅ Post-Deployment Verification

### **1. Check Deployment Logs**

In Railway Dashboard:

- Go to your API service
- Click "Deployments" → Latest deployment
- Check logs for errors

### **2. Test Health Endpoint**

```bash
curl https://your-app.railway.app/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "message": "Admin API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### **3. Test Authentication**

```bash
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@zfitdance.com",
    "password": "Admin@123"
  }'
```

### **4. Test Category Endpoint**

```bash
# Get token from login, then:
curl -X GET https://your-app.railway.app/api/categories \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🛠️ Troubleshooting

### **Issue: "Cannot find module '@prisma/client'"**

**Solution:**

- Ensure Prisma Client is generated in build command
- Add `cd .. && npx prisma generate` to build process

### **Issue: "Prisma schema not found"**

**Solution:**

- Deploy entire `fitness-dance-backend` folder
- Or ensure Prisma schema is accessible from build process

### **Issue: "Database connection failed"**

**Solution:**

1. Check `DATABASE_URL` in environment variables
2. Verify database service is running
3. Use `${{Postgres.DATABASE_URL}}` if database is in same project

### **Issue: "Build fails"**

**Solution:**

1. Check build logs in Railway
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version (Railway auto-detects)

### **Issue: "Port already in use"**

**Solution:**

- Railway automatically sets `PORT` environment variable
- Don't hardcode port, use `process.env.PORT`

---

## 📊 Railway Pricing

**Free Tier:**

- $5 credit/month
- Good for testing/small apps

**Hobby Plan:**

- $5/month + usage
- Good for production

**Pro Plan:**

- $20/month + usage
- More resources, better support

**Database:**

- Included in project
- ~$5-10/month depending on usage

---

## 🔄 Update/Deploy Process

**When updating code:**

1. **Push to GitHub:**

   ```bash
   git add .
   git commit -m "Update admin API"
   git push
   ```

2. **Railway Auto-Deploys:**

   - Automatically detects push
   - Runs build command
   - Deploys new version
   - Zero-downtime deployment

3. **Manual Deploy (if needed):**
   ```bash
   railway up
   ```

---

## 📝 Environment Variables Summary

**Required:**

- `DATABASE_URL` - Auto-injected by Railway
- `JWT_SECRET` - Generate strong secret
- `JWT_REFRESH_SECRET` - Generate strong secret

**Optional (with defaults):**

- `JWT_EXPIRES_IN=30m`
- `JWT_REFRESH_EXPIRES_IN=7d`
- `PORT=3002` (Railway sets this automatically)
- `NODE_ENV=production`
- `CORS_ORIGIN=*` (change for production)

---

## 🎯 Quick Start Checklist

- [ ] Create Railway account
- [ ] Create new project
- [ ] Add PostgreSQL database
- [ ] Deploy admin-api service
- [ ] Set root directory to `admin-api` or `fitness-dance-backend`
- [ ] Configure build command (include Prisma generate)
- [ ] Set environment variables
- [ ] Run migrations
- [ ] Test endpoints
- [ ] Configure custom domain (optional)

---

## 💡 Pro Tips

1. **Use Railway's Environment Variables:**

   - Reference database: `${{Postgres.DATABASE_URL}}`
   - Share variables between services

2. **Monitor Usage:**

   - Check Railway dashboard for usage
   - Set up billing alerts

3. **Backup Database:**

   - Railway provides automatic backups
   - Can also export manually

4. **Scaling:**
   - Railway auto-scales based on traffic
   - Can manually adjust resources

---

**Ready to deploy on Railway!** 🚂
