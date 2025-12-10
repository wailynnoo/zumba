# Railway Manual Deployment Guide 🚂

**Deploy entire `fitness-dance-backend` folder without GitHub**

---

## 🎯 What We're Doing

- ✅ Deploy entire `fitness-dance-backend` folder
- ✅ Use Railway CLI (no GitHub required)
- ✅ Use Railway's default domain (add custom domain later)
- ✅ Deploy database + admin-api

---

## 📋 Prerequisites

1. **Railway Account:**

   - Sign up at https://railway.app
   - Verify your email

2. **Railway CLI:**

   - Install: `npm install -g @railway/cli`
   - Login: `railway login`

3. **Code Ready:**
   - All code in `fitness-dance-backend/` folder
   - Tested locally

---

## 🚀 Step-by-Step Deployment

### **Step 1: Install Railway CLI**

```bash
npm install -g @railway/cli
```

**Verify installation:**

```bash
railway --version
```

---

### **Step 2: Login to Railway**

```bash
railway login
```

This will open your browser to authenticate.

---

### **Step 3: Navigate to Project Root**

```bash
cd D:\Zumba\fitness-dance-backend
```

**Important:** We're in the root folder, not `admin-api/`

---

### **Step 4: Initialize Railway Project**

```bash
railway init
```

**Options:**

- Create new project: Type project name (e.g., `fitness-dance-backend`)
- Or link to existing project: Select from list

This creates `.railway/` folder with project configuration.

---

### **Step 5: Add PostgreSQL Database**

**Option A: Using Railway Dashboard (Easier)**

1. Go to https://railway.app/dashboard
2. Open your project
3. Click "New" → "Database" → "Add PostgreSQL"
4. Wait 1-2 minutes for database to be created
5. Railway automatically creates `DATABASE_URL` environment variable

**Option B: Using Railway CLI**

```bash
railway add postgresql
```

---

### **Step 6: Create Admin API Service**

**In Railway Dashboard:**

1. Go to your project
2. Click "New" → "Empty Service"
3. Name it: `admin-api`

**Or using CLI:**

```bash
railway service
# Select "Create new service"
# Name: admin-api
```

---

### **Step 7: Configure Service Settings**

**In Railway Dashboard → admin-api service → Settings:**

1. **Root Directory:** Leave empty (we're deploying from root)

   - Or set to: `.` (current directory)

2. **Build Command:**

   ```bash
   cd admin-api && npm install && npm run build && cd .. && npx prisma generate
   ```

3. **Start Command:**
   ```bash
   cd admin-api && npm start
   ```

**Alternative (if Railway detects package.json in root):**

If you have a root `package.json`, you can also do:

1. **Build Command:**

   ```bash
   cd admin-api && npm install && npm run build && cd .. && npx prisma generate
   ```

2. **Start Command:**
   ```bash
   cd admin-api && npm start
   ```

---

### **Step 8: Set Environment Variables**

**Using Railway Dashboard (Recommended):**

1. Go to `admin-api` service
2. Click "Variables" tab
3. Add these variables:

```env
# Database (Auto-injected if database is in same project)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Configuration (Generate strong secrets!)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_REFRESH_SECRET=your-refresh-token-secret-min-32-characters-long
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3002
NODE_ENV=production

# CORS Configuration (Use Railway default domain for now)
CORS_ORIGIN=*
```

**Using Railway CLI:**

```bash
# Set variables one by one
railway variables set JWT_SECRET="your-secret-here"
railway variables set JWT_REFRESH_SECRET="your-refresh-secret-here"
railway variables set NODE_ENV="production"
railway variables set CORS_ORIGIN="*"
```

**Generate JWT Secrets:**

```bash
# Generate random secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
```

---

### **Step 9: Deploy Code**

**Using Railway CLI:**

```bash
# Make sure you're in fitness-dance-backend root
cd D:\Zumba\fitness-dance-backend

# Deploy
railway up
```

**Or using Railway Dashboard:**

1. Go to `admin-api` service
2. Click "Deployments" → "Deploy"
3. Upload your code (or use CLI method above)

---

### **Step 10: Run Database Migrations**

**Using Railway CLI:**

```bash
# Make sure you're in project root
cd D:\Zumba\fitness-dance-backend

# Run migrations
railway run npx prisma migrate deploy
```

**Or in Railway Dashboard:**

1. Go to `admin-api` service
2. Click "Deployments" → Latest deployment
3. Click "Run Command"
4. Enter: `npx prisma migrate deploy`

---

### **Step 11: Seed Initial Data (Optional)**

```bash
railway run npm run seed
```

**Or in Dashboard:**

- Go to service → Deployments → Run Command
- Enter: `npm run seed`

---

### **Step 12: Get Your API URL**

**Railway provides a default domain:**

1. Go to `admin-api` service
2. Click "Settings" → "Generate Domain"
3. Railway provides: `your-app-name.up.railway.app`
4. Copy this URL

**Example:** `admin-api-production.up.railway.app`

---

### **Step 13: Test Deployment**

```bash
# Health check
curl https://your-app-name.up.railway.app/health

# Expected response:
# {
#   "status": "ok",
#   "message": "Admin API is running",
#   "timestamp": "..."
# }
```

---

## 🔧 Configuration Files

### **Create `railway.json` (Optional)**

In `fitness-dance-backend/admin-api/railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd admin-api && npm install && npm run build && cd .. && npx prisma generate"
  },
  "deploy": {
    "startCommand": "cd admin-api && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## 📁 Project Structure for Railway

```
fitness-dance-backend/          # Root (deploy this)
├── .railway/                    # Railway config (auto-created)
├── prisma/                      # Prisma schema (needed for migrations)
│   ├── schema.prisma
│   └── migrations/
├── admin-api/                   # Admin API code
│   ├── src/
│   ├── package.json
│   └── dist/                    # Built files
├── member-api/                  # Member API (not deploying yet)
└── prisma.config.ts             # Prisma 7 config
```

---

## 🔄 Update/Deploy Process

**When you make changes:**

```bash
# 1. Make your code changes
# 2. Test locally
npm run build  # in admin-api folder

# 3. Deploy to Railway
cd D:\Zumba\fitness-dance-backend
railway up

# 4. Run migrations if schema changed
railway run npx prisma migrate deploy
```

---

## 🌐 Adding Custom Domain Later

**When you buy a domain:**

1. **In Railway Dashboard:**

   - Go to `admin-api` service
   - Click "Settings" → "Custom Domain"
   - Enter your domain: `api.yourdomain.com`

2. **Update DNS:**

   - Railway will provide DNS records
   - Add CNAME record in your domain provider
   - Point to Railway's domain

3. **Update CORS:**

   - Update `CORS_ORIGIN` environment variable
   - Change from `*` to your frontend domain

4. **SSL Certificate:**
   - Railway automatically provisions SSL
   - No additional setup needed

---

## 🛠️ Troubleshooting

### **Issue: "Cannot find module '@prisma/client'"**

**Solution:**

- Ensure build command includes: `cd .. && npx prisma generate`
- Check that Prisma schema is accessible from root

### **Issue: "Prisma schema not found"**

**Solution:**

- Make sure you're deploying from `fitness-dance-backend/` root
- Prisma schema should be in `prisma/schema.prisma`

### **Issue: "Build fails"**

**Solution:**

1. Check Railway deployment logs
2. Verify build command is correct
3. Ensure all dependencies in `admin-api/package.json`

### **Issue: "Database connection failed"**

**Solution:**

1. Check `DATABASE_URL` in environment variables
2. Use `${{Postgres.DATABASE_URL}}` if database is in same project
3. Verify database service is running

---

## 📝 Environment Variables Checklist

- [ ] `DATABASE_URL` - Use `${{Postgres.DATABASE_URL}}`
- [ ] `JWT_SECRET` - Generated strong secret (32+ chars)
- [ ] `JWT_REFRESH_SECRET` - Generated strong secret (32+ chars)
- [ ] `JWT_EXPIRES_IN=30m`
- [ ] `JWT_REFRESH_EXPIRES_IN=7d`
- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGIN=*` (change later when you have domain)
- [ ] `PORT=3002` (Railway sets this automatically, but good to have)

---

## ✅ Deployment Checklist

- [ ] Railway account created
- [ ] Railway CLI installed and logged in
- [ ] Project initialized (`railway init`)
- [ ] PostgreSQL database added
- [ ] Admin API service created
- [ ] Build command configured
- [ ] Start command configured
- [ ] Environment variables set
- [ ] Code deployed (`railway up`)
- [ ] Migrations run (`railway run npx prisma migrate deploy`)
- [ ] Health check tested
- [ ] API endpoints tested

---

## 🎯 Quick Command Reference

```bash
# Login
railway login

# Initialize project
railway init

# Add database
railway add postgresql

# Set environment variable
railway variables set KEY="value"

# Deploy
railway up

# Run command (migrations, seed, etc.)
railway run npx prisma migrate deploy

# View logs
railway logs

# Open dashboard
railway open
```

---

## 💡 Pro Tips

1. **Use Railway Dashboard for Environment Variables:**

   - Easier to manage than CLI
   - Can see all variables at once

2. **Monitor Deployments:**

   - Check logs in Railway dashboard
   - Set up alerts for failed deployments

3. **Database Backups:**

   - Railway provides automatic backups
   - Can also export manually from dashboard

4. **Cost Management:**
   - Monitor usage in Railway dashboard
   - Set up billing alerts

---

## 🚀 Next Steps After Deployment

1. ✅ Test all API endpoints
2. ✅ Set up monitoring/alerts
3. ✅ Configure custom domain (when you have one)
4. ✅ Update CORS_ORIGIN with your frontend domain
5. ✅ Set up database backups
6. ✅ Document API endpoints for frontend team

---

**Ready to deploy!** 🚂

Follow the steps above, and your admin-api will be live on Railway!
