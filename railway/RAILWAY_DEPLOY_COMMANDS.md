# Railway Deployment - Quick Command Reference 🚂

**Copy-paste commands for manual Railway deployment**

---

## 🔧 Setup Commands

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Navigate to project root
cd D:\Zumba\fitness-dance-backend

# 4. Initialize Railway project
railway init
# Select: Create new project
# Name: fitness-dance-backend
```

---

## 📦 Add Database

**Option 1: Using Dashboard (Recommended)**

- Go to https://railway.app/dashboard
- Open your project
- Click "New" → "Database" → "Add PostgreSQL"

**Option 2: Using CLI**

```bash
railway add postgresql
```

---

## 🚀 Deploy Admin API

### **Step 1: Create Service**

**In Railway Dashboard:**

- Click "New" → "Empty Service"
- Name: `admin-api`

### **Step 2: Configure Build & Start**

**In Railway Dashboard → admin-api → Settings:**

**Build Command:**

```bash
cd admin-api && npm install && cd .. && npx prisma generate && cd admin-api && npm run build
```

**Start Command:**

```bash
cd admin-api && npm start
```

### **Step 3: Set Environment Variables**

**In Railway Dashboard → admin-api → Variables:**

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=GENERATE_STRONG_SECRET_32_CHARS_MIN
JWT_REFRESH_SECRET=GENERATE_STRONG_SECRET_32_CHARS_MIN
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=production
CORS_ORIGIN=*
PORT=3002
```

**Generate Secrets:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### **Step 4: Deploy**

```bash
# Make sure you're in project root
cd D:\Zumba\fitness-dance-backend

# Deploy
railway up
```

---

## 🚀 Deploy Member API

### **Step 1: Create Service**

**In Railway Dashboard:**

- Click "New" → "Empty Service"
- Name: `member-api`

### **Step 2: Configure Build & Start**

**In Railway Dashboard → member-api → Settings:**

**Build Command:**

```bash
cd member-api && npm install && cd .. && npx prisma generate && cd member-api && npm run build
```

**Start Command:**

```bash
cd member-api && npm start
```

### **Step 3: Set Environment Variables**

**In Railway Dashboard → member-api → Variables:**

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=GENERATE_STRONG_SECRET_32_CHARS_MIN
JWT_REFRESH_SECRET=GENERATE_STRONG_SECRET_32_CHARS_MIN
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=production
CORS_ORIGIN=*
PORT=3001
```

**Generate Secrets (Different from admin-api!):**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Run twice** to generate two different secrets.

### **Step 4: Deploy**

```bash
# Make sure you're in project root
cd D:\Zumba\fitness-dance-backend

# Deploy
railway up
```

---

## 🗄️ Database Setup

```bash
# Run migrations
railway run npx prisma migrate deploy

# Seed data (optional)
railway run npm run seed
```

---

## ✅ Test Deployment

```bash
# Get your Railway URL from dashboard
# Example: https://admin-api-production.up.railway.app

# Test health endpoint
curl https://your-app-name.up.railway.app/health

# Test login
curl -X POST https://your-app-name.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zfitdance.com", "password": "Admin@123"}'
```

---

## 🔄 Update Commands

```bash
# After making code changes:
cd D:\Zumba\fitness-dance-backend
railway up

# If schema changed:
railway run npx prisma migrate deploy
```

---

## 📊 Useful Commands

```bash
# View logs
railway logs

# Open dashboard
railway open

# List services
railway status

# Set environment variable
railway variables set KEY="value"

# View environment variables
railway variables
```

---

## 🌐 Add Custom Domain Later

**When you have a domain:**

1. Railway Dashboard → admin-api → Settings → Custom Domain
2. Enter: `api.yourdomain.com`
3. Add DNS records (Railway provides instructions)
4. Update `CORS_ORIGIN` environment variable

---

**That's it!** 🎉
