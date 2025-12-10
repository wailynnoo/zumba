# Railway Post-Deployment Steps ✅

**Deployment successful! Now let's complete the setup.**

---

## ✅ Completed

- ✅ Railway project created
- ✅ PostgreSQL database added
- ✅ Admin API service deployed
- ✅ Service is online

---

## 📋 Next Steps

### **Step 1: Run Database Migrations**

**Using Railway CLI:**

```bash
railway run npx prisma migrate deploy
```

**Or in Railway Dashboard:**

1. Go to `admin-api` service
2. Click "Deployments" tab
3. Click on latest deployment
4. Click "Run Command"
5. Enter: `npx prisma migrate deploy`
6. Click "Run"

**This creates all database tables!**

---

### **Step 2: Seed Initial Data (Optional but Recommended)**

**Using Railway CLI:**

```bash
railway run npm run seed
```

**Or in Railway Dashboard:**

1. Go to `admin-api` service
2. Click "Deployments" → Latest → "Run Command"
3. Enter: `npm run seed`
4. Click "Run"

**This creates:**

- Dance styles
- Intensity levels
- Video categories
- Subscription plans
- Admin roles
- Super Admin account (admin@zfitdance.com / Admin@123)

---

### **Step 3: Get Your API URL**

**In Railway Dashboard:**

1. Go to `admin-api` service
2. Click "Settings" tab
3. Scroll to "Networking" section
4. Click "Generate Domain"
5. Railway provides: `your-app-name.up.railway.app`
6. Copy this URL

**Example:** `admin-api-production.up.railway.app`

---

### **Step 4: Test Your API**

**Health Check:**

```bash
curl https://your-app-name.up.railway.app/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "message": "Admin API is running",
  "timestamp": "2024-12-06T..."
}
```

**Test Login:**

```bash
curl -X POST https://your-app-name.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@zfitdance.com",
    "password": "Admin@123"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {...},
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

---

### **Step 5: Test Category Endpoints (with Auth)**

**Get Access Token from login response, then:**

```bash
# List categories
curl -X GET https://your-app-name.up.railway.app/api/categories \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Create category
curl -X POST https://your-app-name.up.railway.app/api/categories \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Full Workout",
    "slug": "full-workout",
    "description": "Complete workout sessions",
    "isActive": true,
    "sortOrder": 1
  }'
```

---

## 🔧 Important Notes

### **Service is "Unexposed"**

If you see "Unexposed service" in Railway:

- This means the service is running but not publicly accessible
- Click the link icon or "Generate Domain" to make it public
- Railway will provide a public URL

### **Environment Variables**

Verify these are set in Railway Dashboard → admin-api → Variables:

- ✅ `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- ✅ `JWT_SECRET=...`
- ✅ `JWT_REFRESH_SECRET=...`
- ✅ `NODE_ENV=production`
- ✅ `CORS_ORIGIN=*`

---

## 🌐 Add Custom Domain (Later)

**When you have a domain:**

1. **In Railway Dashboard:**

   - Go to `admin-api` service → Settings
   - Click "Custom Domain"
   - Enter: `api.yourdomain.com`

2. **Update DNS:**

   - Railway provides DNS records
   - Add CNAME record in your domain provider
   - Point to Railway's domain

3. **Update CORS:**

   - Update `CORS_ORIGIN` environment variable
   - Change from `*` to your frontend domain

4. **SSL Certificate:**
   - Railway automatically provisions SSL
   - No additional setup needed

---

## 📊 Monitoring

**Check Logs:**

- Railway Dashboard → admin-api → Logs
- View real-time logs
- Debug any issues

**Check Metrics:**

- Railway Dashboard → admin-api → Metrics
- View CPU, memory, network usage

---

## ✅ Post-Deployment Checklist

- [ ] Run database migrations
- [ ] Seed initial data (optional)
- [ ] Get API URL
- [ ] Test health endpoint
- [ ] Test login endpoint
- [ ] Test category endpoints (with auth)
- [ ] Verify environment variables
- [ ] Set up monitoring/alerts (optional)
- [ ] Document API URL for frontend team

---

## 🎯 Quick Command Reference

```bash
# Run migrations
railway run npx prisma migrate deploy

# Seed data
railway run npm run seed

# View logs
railway logs

# Open dashboard
railway open

# Test health
curl https://your-app-name.up.railway.app/health
```

---

## 🚀 You're Live!

Your admin-api is now deployed and running on Railway! 🎉

**Next:**

1. Run migrations
2. Seed data
3. Get API URL
4. Test endpoints
5. Share API URL with frontend team

---

**Congratulations on successful deployment!** 🚂✨
