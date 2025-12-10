# Fix 502 Bad Gateway Error 🔧

**Error:** `502 Bad Gateway - Application failed to respond`

**This means:** The application crashed or isn't running properly.

---

## 🔍 Step 1: Check Railway Logs

**In Railway Dashboard:**

1. Go to `admin-api` service
2. Click **"Logs"** tab
3. Look for error messages
4. Check the latest logs for startup errors

**Common errors to look for:**

- Database connection errors
- Missing environment variables
- Port binding errors
- Module not found errors
- Application crashes

---

## 🔧 Common Issues & Fixes

### **Issue 1: Database Connection Failed**

**Error in logs:** `Can't reach database server` or `Connection refused`

**Fix:**

1. Check `DATABASE_URL` environment variable
2. Should be: `${{Postgres.DATABASE_URL}}`
3. Verify Postgres service is online
4. Check if database is in same Railway project

---

### **Issue 2: Missing Environment Variables**

**Error in logs:** `JWT_SECRET is not defined` or similar

**Fix:**

1. Go to Railway Dashboard → admin-api → Variables
2. Verify all required variables are set:
   - `DATABASE_URL=${{Postgres.DATABASE_URL}}`
   - `JWT_SECRET=...`
   - `JWT_REFRESH_SECRET=...`
   - `NODE_ENV=production`
   - `CORS_ORIGIN=*`
   - `PORT=3002`

---

### **Issue 3: Application Crashed on Startup**

**Error in logs:** `Error: Cannot find module` or `TypeError`

**Fix:**

1. Check if Prisma Client is generated
2. Verify all dependencies are installed
3. Check if build completed successfully
4. Look for TypeScript compilation errors

---

### **Issue 4: Port Binding Error**

**Error in logs:** `EADDRINUSE` or port already in use

**Fix:**

1. Railway sets `PORT` automatically
2. Don't hardcode port in code
3. Use `process.env.PORT || 3002` in your code
4. Verify start command is correct

---

### **Issue 5: Application Not Listening**

**Error:** No errors but 502 response

**Fix:**

1. Check if application is actually starting
2. Verify `app.listen()` is called
3. Check if listening on correct port
4. Look for "Server running" messages in logs

---

## 🛠️ Quick Fixes

### **Fix 1: Restart Service**

**In Railway Dashboard:**

1. Go to admin-api service
2. Click "Deployments" tab
3. Click "Redeploy" or trigger new deployment

---

### **Fix 2: Check Service Status**

**In Railway Dashboard:**

1. Go to Architecture view
2. Check if admin-api shows "Online" (green dot)
3. If red or offline, service crashed

---

### **Fix 3: Verify Environment Variables**

**In Railway Dashboard:**

1. Go to admin-api → Variables
2. Check `DATABASE_URL` format:
   - Should be: `${{Postgres.DATABASE_URL}}`
   - NOT: `postgresql://...` (unless database is separate)
3. Verify all JWT secrets are set

---

### **Fix 4: Check Build/Start Commands**

**In Railway Dashboard → admin-api → Settings:**

**Build Command:**

```bash
cd admin-api && npm install && cd .. && npx prisma generate && cd admin-api && npm run build
```

**Start Command:**

```bash
cd admin-api && npm start
```

---

## 🔍 Debugging Steps

### **Step 1: Check Logs**

- Railway Dashboard → admin-api → Logs
- Look for errors, warnings, or crash messages
- Check if application started successfully

### **Step 2: Verify Service is Running**

- Railway Dashboard → Architecture
- admin-api should show "Online" (green)
- If red/yellow, service has issues

### **Step 3: Test Health Endpoint**

```bash
curl https://admin-api-production-5059.up.railway.app/health
```

### **Step 4: Check Database Connection**

- Verify Postgres service is online
- Check DATABASE_URL is correct
- Test connection from logs

---

## 📝 What to Share

**If you need help, share:**

1. Latest logs from Railway (admin-api → Logs)
2. Service status (Online/Offline)
3. Environment variables (screenshot or list)
4. Any error messages from logs

---

## ✅ Quick Checklist

- [ ] Check Railway logs for errors
- [ ] Verify service is "Online" (green)
- [ ] Check all environment variables are set
- [ ] Verify DATABASE_URL format
- [ ] Check build/start commands
- [ ] Try restarting the service
- [ ] Test health endpoint

---

**Check the logs first - that will tell us what's wrong!** 🔍
