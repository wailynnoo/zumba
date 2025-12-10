# Admin API - Deployment Guide 🚀

**Complete guide for deploying admin-api to production hosting**

---

## 📋 Pre-Deployment Checklist

### **1. Code Readiness**

- [x] All dependencies installed (`npm install`)
- [x] TypeScript compiles without errors (`npm run build`)
- [x] All environment variables identified
- [x] `.env.example` file created
- [x] `.gitignore` configured correctly

### **2. Security Checklist**

- [ ] Strong JWT secrets generated (min 32 characters)
- [ ] CORS origin set to specific domain (not `*`)
- [ ] Database credentials secure
- [ ] `NODE_ENV=production` set
- [ ] No sensitive data in code

### **3. Database Readiness**

- [ ] Database created and accessible
- [ ] Database migrations ready to run
- [ ] Seed data ready (if needed)
- [ ] Database backup strategy in place

---

## 🔧 Required Environment Variables

Create a `.env` file in the `admin-api` directory with these variables:

```env
# Database Connection (REQUIRED)
DATABASE_URL=postgresql://user:password@host:5432/database_name

# JWT Secrets (REQUIRED - Generate strong secrets!)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_REFRESH_SECRET=your-refresh-token-secret-min-32-characters-long

# JWT Expiration (Optional - defaults shown)
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration (Optional - defaults shown)
PORT=3002
NODE_ENV=production

# CORS Configuration (REQUIRED for production)
# Replace with your actual frontend domain(s)
CORS_ORIGIN=https://admin.zfitdance.com
```

### **⚠️ Important Notes:**

1. **JWT Secrets**: Must be at least 32 characters long. Generate strong random strings:

   ```bash
   # Generate random secret (Linux/Mac)
   openssl rand -base64 32

   # Or use Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

2. **CORS_ORIGIN**:

   - **Development**: Can use `*` (allows all origins)
   - **Production**: Must specify exact domain(s)
   - Multiple domains: `https://admin.zfitdance.com,https://www.zfitdance.com`

3. **DATABASE_URL**: Format depends on your hosting provider:
   - **Supabase**: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?pgbouncer=true`
   - **Railway**: Provided in dashboard
   - **Local**: `postgresql://user:password@localhost:5432/dbname`

---

## 📦 Project Structure for Deployment

**Important:** The Prisma schema is in the **parent directory** (`fitness-dance-backend/prisma/`), not in `admin-api/`.

```
fitness-dance-backend/
├── prisma/                    # ⚠️ Prisma schema is here!
│   ├── schema.prisma
│   └── migrations/
├── admin-api/                 # Your API code
│   ├── src/
│   ├── dist/                  # Generated after build
│   ├── .env                   # Your environment variables
│   ├── package.json
│   └── tsconfig.json
└── prisma.config.ts           # Prisma 7 config
```

---

## 🚀 Deployment Steps

### **Step 1: Prepare Code for Upload**

```bash
cd fitness-dance-backend/admin-api

# 1. Build TypeScript
npm run build

# 2. Verify dist/ folder is created
ls dist/

# 3. Test locally (optional but recommended)
npm start
```

### **Step 2: Upload Files to Hosting**

**Files to upload:**

- ✅ `src/` - Source code (or just `dist/` if hosting supports build)
- ✅ `package.json` - Dependencies
- ✅ `package-lock.json` - Lock file
- ✅ `tsconfig.json` - TypeScript config
- ✅ `.env` - Environment variables (or set in hosting dashboard)
- ✅ `prisma/` - From parent directory (if needed for migrations)
- ✅ `prisma.config.ts` - From parent directory

**Files NOT to upload:**

- ❌ `node_modules/` - Install on server
- ❌ `dist/` - Build on server (if hosting supports)
- ❌ `.env` - Set in hosting dashboard instead

### **Step 3: Server Setup**

**On your hosting server:**

```bash
# 1. Navigate to project directory
cd /path/to/admin-api

# 2. Install dependencies
npm install --production

# 3. Build TypeScript (if not already built)
npm run build

# 4. Generate Prisma Client
# Note: Prisma schema is in parent directory
cd ..
npx prisma generate
cd admin-api

# 5. Run database migrations
cd ..
npx prisma migrate deploy
cd admin-api

# 6. Set environment variables (or use hosting dashboard)
# Copy .env.example to .env and fill in values

# 7. Start the server
npm start
```

### **Step 4: Database Setup**

**Before starting the API, ensure database is ready:**

```bash
# From parent directory (fitness-dance-backend/)
cd ..

# 1. Generate Prisma Client
npx prisma generate

# 2. Run migrations
npx prisma migrate deploy

# 3. (Optional) Seed initial data
npm run seed
```

---

## 🌐 Hosting Platform Specific Guides

### **Option 1: Railway**

1. **Connect Repository:**

   - Go to Railway dashboard
   - New Project → Deploy from GitHub
   - Select your repository
   - Set root directory: `admin-api`

2. **Environment Variables:**

   - Add all variables from `.env.example`
   - Railway auto-detects `DATABASE_URL` if you add PostgreSQL service

3. **Build Settings:**

   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Root Directory: `admin-api`

4. **Prisma Setup:**
   - Add build step: `cd .. && npx prisma generate && cd admin-api`
   - Or create custom script in `package.json`

### **Option 2: Render**

1. **Create Web Service:**

   - New → Web Service
   - Connect repository
   - Root Directory: `admin-api`

2. **Build & Start:**

   - Build Command: `npm install && npm run build && cd .. && npx prisma generate`
   - Start Command: `cd admin-api && npm start`

3. **Environment Variables:**
   - Add all from `.env.example` in dashboard

### **Option 3: DigitalOcean App Platform**

1. **Create App:**

   - Connect GitHub repository
   - Root Directory: `admin-api`

2. **Build Settings:**

   - Build Command: `npm install && npm run build && cd .. && npx prisma generate`
   - Run Command: `cd admin-api && npm start`

3. **Database:**
   - Add managed PostgreSQL database
   - Auto-injects `DATABASE_URL`

### **Option 4: VPS (Ubuntu/Debian)**

**Using PM2 for process management:**

```bash
# 1. Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2 globally
sudo npm install -g pm2

# 3. Navigate to project
cd /var/www/admin-api

# 4. Install dependencies
npm install --production

# 5. Build
npm run build

# 6. Generate Prisma Client
cd ..
npx prisma generate
cd admin-api

# 7. Start with PM2
pm2 start dist/index.js --name admin-api

# 8. Save PM2 configuration
pm2 save

# 9. Setup PM2 to start on boot
pm2 startup
```

---

## 🔍 Post-Deployment Verification

### **1. Health Check**

```bash
curl https://your-domain.com/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "message": "Admin API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### **2. Test Authentication**

```bash
# Test login endpoint
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@zfitdance.com",
    "password": "Admin@123"
  }'
```

### **3. Test Category Endpoint (with auth)**

```bash
# Get token from login response, then:
curl -X GET https://your-domain.com/api/categories \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🛠️ Troubleshooting

### **Issue: "Cannot find module '@prisma/client'"**

**Solution:**

```bash
cd ..
npx prisma generate
cd admin-api
```

### **Issue: "PrismaClient needs to be constructed with adapter"**

**Solution:** Ensure `DATABASE_URL` is set correctly in `.env`

### **Issue: "Database connection failed"**

**Solution:**

1. Check `DATABASE_URL` format
2. Verify database is accessible from hosting server
3. Check firewall/security group settings
4. For Supabase: Ensure connection pooling is enabled

### **Issue: "JWT_SECRET is not defined"**

**Solution:** Add `JWT_SECRET` and `JWT_REFRESH_SECRET` to environment variables

### **Issue: CORS errors**

**Solution:** Update `CORS_ORIGIN` to match your frontend domain exactly

---

## 📝 Production Best Practices

### **1. Security**

- ✅ Use strong JWT secrets (32+ characters)
- ✅ Set specific CORS origins (not `*`)
- ✅ Use HTTPS only
- ✅ Enable rate limiting (recommended)
- ✅ Regular security updates

### **2. Monitoring**

- ✅ Set up error logging (Sentry, LogRocket, etc.)
- ✅ Monitor API response times
- ✅ Set up uptime monitoring
- ✅ Database connection monitoring

### **3. Performance**

- ✅ Enable database connection pooling
- ✅ Use CDN for static assets (if any)
- ✅ Enable compression middleware
- ✅ Cache frequently accessed data

### **4. Maintenance**

- ✅ Regular database backups
- ✅ Keep dependencies updated
- ✅ Monitor logs regularly
- ✅ Set up alerts for errors

---

## 🔄 Update/Deploy Process

**When updating code:**

```bash
# 1. Pull latest code
git pull

# 2. Install new dependencies (if any)
npm install

# 3. Build
npm run build

# 4. Run migrations (if schema changed)
cd ..
npx prisma migrate deploy
npx prisma generate
cd admin-api

# 5. Restart server
pm2 restart admin-api  # If using PM2
# Or restart via hosting dashboard
```

---

## 📞 Support

If you encounter issues:

1. Check server logs
2. Verify environment variables
3. Test database connection
4. Verify Prisma Client is generated
5. Check hosting platform documentation

---

**Ready to deploy!** 🚀
