# Verify Railway Commands Are Set Correctly ✅

**Error persists:** `Error: Cannot find module '/app/index.js'`

**This means Railway is still using auto-detection instead of your custom commands!**

---

## 🔍 Step 1: Verify Commands Are Set

### **In Railway Dashboard:**

1. Go to Railway Dashboard
2. Click on **`member-api`** service
3. Click **"Settings"** tab
4. Check these sections:

**A. Build Command:**

- Click **"Build"** link in right sidebar
- Look at **"Custom Build Command"** field
- **Should show:**
  ```
  cd member-api && npm install && cd .. && npx prisma generate && cd member-api && npm run build
  ```
- **If empty or shows something else:** That's the problem! Set it now.

**B. Start Command:**

- Click **"Deploy"** link in right sidebar
- Look at **"Custom Start Command"** field
- **Should show:**
  ```
  cd member-api && npm start
  ```
- **If empty or shows something else:** That's the problem! Set it now.

---

## 🚨 Common Issues

### **Issue 1: Commands Not Saved**

**Symptoms:**

- You set the commands but they're empty when you check again
- Railway keeps using `node index.js`

**Fix:**

1. Make sure you click **"Save"** after entering commands
2. Some Railway interfaces auto-save - wait a moment
3. Refresh the page and check again

### **Issue 2: Wrong Service**

**Symptoms:**

- You set commands on one service but deployment goes to another

**Fix:**

1. Check which service is actually deploying
2. Look at the service name in Railway Dashboard
3. Make sure you're setting commands on the **correct service**

### **Issue 3: Railpack Override**

**Symptoms:**

- Commands are set but Railway still uses auto-detection

**Fix:**

1. Try disabling Railpack auto-detection
2. Or use a `railway.json` config file (see below)

---

## ✅ Step 2: Set Commands Correctly

### **Build Command:**

1. Railway Dashboard → `member-api` → **Settings** → **Build**
2. **Custom Build Command** field:
   ```
   cd member-api && npm install && cd .. && npx prisma generate && cd member-api && npm run build
   ```
3. **Save** (click save button or wait for auto-save)

### **Start Command:**

1. Railway Dashboard → `member-api` → **Settings** → **Deploy**
2. **Custom Start Command** field:
   ```
   cd member-api && npm start
   ```
3. **Save** (click save button or wait for auto-save)

---

## 🔄 Step 3: Force Redeploy

After setting commands:

1. Railway Dashboard → `member-api` → **Deployments**
2. Click **"Redeploy"** button (or three dots menu → Redeploy)
3. Or trigger a new deployment by:
   - Making a small code change
   - Or running `railway up` again

---

## 🎯 Alternative: Use railway.json Config

If Railway still ignores your commands, create a config file:

### **Create `railway.json` in project root:**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd member-api && npm install && cd .. && npx prisma generate && cd member-api && npm run build"
  },
  "deploy": {
    "startCommand": "cd member-api && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Note:** This applies globally. If you have multiple services, you might need service-specific configs.

---

## 🔍 Step 4: Check Build Logs

After redeploying, check build logs:

1. Railway Dashboard → `member-api` → **Deployments**
2. Click on latest deployment
3. Check **"Build Logs"** tab
4. **Look for:**
   - ✅ Your custom build command running
   - ✅ `npm install` in member-api
   - ✅ `npx prisma generate`
   - ✅ `npm run build` in member-api
   - ✅ `dist/` folder created

**If you see `npm ci` at root instead:** Commands aren't being used!

---

## 🔍 Step 5: Check Runtime Logs

After deployment starts, check runtime logs:

1. Railway Dashboard → `member-api` → **Logs** tab
2. **Look for:**
   - ✅ `cd member-api && npm start` running
   - ✅ `🚀 Member API server running on port 3001`
   - ❌ `Error: Cannot find module '/app/index.js'` (should NOT appear)

**If you see the error:** Start command isn't being used!

---

## 📋 Verification Checklist

- [ ] Build Command is set in Railway Dashboard
- [ ] Start Command is set in Railway Dashboard
- [ ] Commands are saved (not empty when you check)
- [ ] Service redeployed after setting commands
- [ ] Build logs show your custom build command
- [ ] Runtime logs show your custom start command
- [ ] No more `Cannot find module '/app/index.js'` error

---

## 🚨 If Still Not Working

**Try this:**

1. **Delete and recreate the service:**

   - Railway Dashboard → `member-api` → Settings → Danger → Delete
   - Create new service: `member-api`
   - Set commands BEFORE first deployment
   - Then deploy

2. **Or use Railway CLI with explicit service:**

   ```bash
   railway up --service member-api
   ```

3. **Or check if there's a service-specific config:**
   - Some Railway setups use service-specific settings
   - Check if there's a `member-api/railway.json` or similar

---

**The key is: Commands MUST be set in Railway Dashboard BEFORE deployment!** 🎯
