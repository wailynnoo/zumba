# Deploy Member API to Railway 🚀

**Step-by-step guide to deploy member-api to Railway**

---

## 📋 Prerequisites

- ✅ Railway account (already have)
- ✅ Railway project: `fitness-dance-backend` (already created)
- ✅ Postgres database (already set up)
- ✅ admin-api deployed (already done)

---

## 🎯 Step 1: Create Member API Service

### **In Railway Dashboard:**

1. Go to Railway Dashboard
2. Open your project: `fitness-dance-backend`
3. Click **"New"** → **"Empty Service"**
4. Name it: `member-api`
5. Click **"Create"** or **"Add"**

---

## 🔧 Step 2: Configure Build & Start Commands

### **In Railway Dashboard → member-api → Settings:**

**Click "Build" link in right sidebar (or scroll to "Custom Build Command")**

**Build Command:**

```
cd member-api && npm install && cd .. && npx prisma generate && cd member-api && npm run build
```

**Click "Deploy" link in right sidebar (or scroll to "Custom Start Command")**

**Start Command:**

```
cd member-api && npm start
```

**Important:** Generate Prisma Client BEFORE building TypeScript! ✅

---

## 🔐 Step 3: Set Environment Variables

### **In Railway Dashboard → member-api → Variables tab:**

Add these environment variables:

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

### **Generate JWT Secrets:**

**Option 1: Using Node.js**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 2: Using PowerShell**

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Run twice** to generate two different secrets:

- One for `JWT_SECRET`
- One for `JWT_REFRESH_SECRET`

**Important Notes:**

- Use `${{Postgres.DATABASE_URL}}` to auto-inject database URL
- Use **different secrets** than admin-api (for security)
- Keep secrets secure - never commit to Git!

---

## 🚀 Step 4: Deploy

### **Option 1: Using Railway CLI (Recommended)**

```bash
# Make sure you're in project root
cd D:\Zumba\fitness-dance-backend

# Deploy
railway up
```

### **Option 2: Using Railway Dashboard**

1. Railway Dashboard → `member-api` service
2. Click **"Deployments"** tab
3. Click **"Deploy"** or **"Redeploy"** button
4. Railway will automatically:
   - Run build command
   - Start the service
   - Show deployment logs

---

## ✅ Step 5: Verify Deployment

### **Check Service Status:**

1. Railway Dashboard → `member-api` service
2. Check status should be **"Online"** (green dot)
3. Check **"Deployments"** tab - latest should be **"Active"**

### **Test Health Endpoint:**

1. Get your Railway URL from dashboard
2. Example: `https://member-api-production-xxxx.up.railway.app`
3. Test in browser or Postman:
   ```
   GET https://your-member-api-url.up.railway.app/health
   ```

**Expected Response:**

```json
{
  "status": "ok",
  "service": "member-api",
  "timestamp": "2025-12-08T..."
}
```

### **Test API Endpoints:**

**Register User:**

```bash
POST https://your-member-api-url.up.railway.app/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test123!@#",
  "phoneNumber": "+1234567890",
  "displayName": "Test User",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "address": "123 Test St",
  "weight": 70.5
}
```

**Login:**

```bash
POST https://your-member-api-url.up.railway.app/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test123!@#"
}
```

---

## 🔍 Step 6: Check Logs

### **In Railway Dashboard:**

1. Railway Dashboard → `member-api` service
2. Click **"Logs"** tab
3. Check for:
   - ✅ Server started successfully
   - ✅ Database connection successful
   - ❌ Any errors (fix if found)

### **Common Issues:**

**Error: "Cannot find module '@prisma/client'"**

- **Fix:** Make sure build command generates Prisma Client first

**Error: "Port already in use"**

- **Fix:** Railway auto-assigns port, don't hardcode PORT in code

**Error: "Database connection failed"**

- **Fix:** Check DATABASE_URL is set correctly

---

## 📊 Step 7: Architecture Overview

After deployment, your Railway project should have:

```
fitness-dance-backend (Project)
├── admin-api (Service) ✅
│   └── Port: 3002
├── member-api (Service) ✅
│   └── Port: 3001
└── Postgres (Database) ✅
    └── Shared by both services
```

**Both services share the same database!** ✅

---

## 🎯 Quick Checklist

- [ ] Service created: `member-api`
- [ ] Build Command set: `cd member-api && npm install && cd .. && npx prisma generate && cd member-api && npm run build`
- [ ] Start Command set: `cd member-api && npm start`
- [ ] Environment variables set (8 variables)
- [ ] Service deployed and "Online"
- [ ] Health endpoint working
- [ ] Test registration/login endpoints

---

## 🔄 Update/Deploy Process

**When you make changes to member-api:**

```bash
# 1. Make your code changes
# 2. Test locally
cd member-api
npm run build

# 3. Deploy to Railway
cd D:\Zumba\fitness-dance-backend
railway up
```

**If schema changed:**

```bash
# Run migrations (same database, shared by both services)
railway connect postgres
# Then run SQL commands or use Railway Dashboard
```

---

## 🌐 Custom Domain (Later)

**When you have a domain:**

1. Railway Dashboard → `member-api` → Settings → Custom Domain
2. Enter: `api-member.yourdomain.com` (or similar)
3. Add DNS records (Railway provides instructions)
4. Update `CORS_ORIGIN` environment variable

---

## 💡 Tips

1. **Different Ports:** member-api uses 3001, admin-api uses 3002
2. **Same Database:** Both services share the same Postgres database
3. **Different JWT Secrets:** Use different secrets for each service
4. **Build Order:** Always generate Prisma Client before building TypeScript
5. **Environment Variables:** Use `${{Postgres.DATABASE_URL}}` for database connection

---

## 🚨 Troubleshooting

**If deployment fails:**

- Check build logs in Railway Dashboard
- Verify build command is correct
- Ensure all environment variables are set
- Check that `member-api/package.json` exists

**If service won't start:**

- Check start command is correct
- Verify PORT environment variable
- Check logs for error messages
- Ensure Prisma Client is generated

**If database connection fails:**

- Verify `DATABASE_URL` is set
- Use `${{Postgres.DATABASE_URL}}` format
- Check Postgres service is online

---

**Ready to deploy member-api! Follow the steps above.** 🚀
