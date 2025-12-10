# Railway Deployment Troubleshooting 🔧

**Deployment failed - Let's fix it!**

---

## 🔍 Check Deployment Logs

**In Railway Dashboard:**
1. Go to your project: https://railway.app/dashboard
2. Click on `admin-api` service
3. Click "Deployments" tab
4. Click on the latest (failed) deployment
5. Check the logs for error messages

**Common errors and solutions:**

---

## ❌ Common Issues

### **Issue 1: "Cannot find module" or "Missing dependencies"**

**Solution:**
- Ensure `package.json` is in `admin-api/` folder
- Verify build command includes `npm install`
- Check that all dependencies are listed in `package.json`

---

### **Issue 2: "Prisma schema not found"**

**Solution:**
- Build command must include: `cd .. && npx prisma generate`
- Ensure Prisma schema is in `prisma/schema.prisma` (parent directory)
- Verify `prisma.config.ts` exists in root

---

### **Issue 3: "Build command failed"**

**Solution:**
- Check TypeScript compilation errors
- Run `npm run build` locally first to test
- Verify `tsconfig.json` is correct

---

### **Issue 4: "Start command failed"**

**Solution:**
- Verify `dist/index.js` exists after build
- Check that start command is: `cd admin-api && npm start`
- Ensure `package.json` has `"start": "node dist/index.js"`

---

## 🔧 Step-by-Step Fix

### **Step 1: Verify Local Build Works**

```bash
cd D:\Zumba\fitness-dance-backend\admin-api
npm run build
```

**If this fails, fix the errors first.**

---

### **Step 2: Check Railway Service Configuration**

**In Railway Dashboard → admin-api → Settings:**

1. **Root Directory:** Leave empty or set to `.`

2. **Build Command:**
   ```
   cd admin-api && npm install && npm run build && cd .. && npx prisma generate
   ```

3. **Start Command:**
   ```
   cd admin-api && npm start
   ```

---

### **Step 3: Verify Environment Variables**

**In Railway Dashboard → admin-api → Variables:**

Ensure these are set:
- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `JWT_SECRET=...`
- `JWT_REFRESH_SECRET=...`
- `NODE_ENV=production`
- `CORS_ORIGIN=*`
- `PORT=3002`

---

### **Step 4: Try Alternative Build Command**

If the current build command doesn't work, try:

**Option A: Simpler build (if Prisma is pre-generated)**
```
cd admin-api && npm install && npm run build
```

**Option B: Full path build**
```
cd admin-api && npm install && npm run build && cd ../.. && npx prisma generate && cd fitness-dance-backend/admin-api
```

---

### **Step 5: Check Railway Logs**

**In Railway Dashboard:**
1. Go to `admin-api` service
2. Click "Logs" tab
3. Look for error messages
4. Share the error with me if you need help

---

## 🎯 Quick Test

**Test build locally first:**

```bash
cd D:\Zumba\fitness-dance-backend\admin-api
npm install
npm run build
cd ..
npx prisma generate
cd admin-api
npm start
```

**If this works locally, the same commands should work on Railway.**

---

## 💡 Pro Tips

1. **Check logs in Railway dashboard** - Most errors are visible there
2. **Test build locally first** - Fix errors before deploying
3. **Use Railway dashboard** - Sometimes easier than CLI
4. **Check service settings** - Ensure build/start commands are correct

---

## 🆘 Still Having Issues?

**Share with me:**
1. Error message from Railway logs
2. Your build command
3. Your start command
4. Any local build errors

**I'll help you fix it!** 🔧

