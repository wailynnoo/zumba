# Fix Member API Deployment Error 🚨

**Error:** `Error: Cannot find module '/app/index.js'`

**Problem:** Railway is using Railpack auto-detection instead of your custom build/start commands!

---

## ✅ Solution: Set Custom Commands in Railway Dashboard

Railway is auto-detecting and using default commands. You need to explicitly set the build and start commands.

---

## 🔧 Step 1: Check Which Service is Deploying

The deployment might be going to the wrong service. Check:

1. Railway Dashboard
2. Look at which service shows the error
3. Make sure you're configuring **`member-api`** service (not admin-api)

---

## 🎯 Step 2: Set Build Command

### **In Railway Dashboard:**

1. Go to **`member-api`** service
2. Click **"Settings"** tab
3. Click **"Build"** link in right sidebar (or scroll to "Custom Build Command")
4. Find **"Custom Build Command"** field
5. **Set it to:**
   ```
   cd member-api && npm install && cd .. && npx prisma generate && cd member-api && npm run build
   ```
6. Click **"Save"** (or it auto-saves)

---

## 🚀 Step 3: Set Start Command

### **In Railway Dashboard:**

1. Still in **`member-api`** → **Settings**
2. Click **"Deploy"** link in right sidebar (or scroll to "Custom Start Command")
3. Find **"Custom Start Command"** field
4. **Set it to:**
   ```
   cd member-api && npm start
   ```
5. Click **"Save"** (or it auto-saves)

---

## 📁 Step 4: Set Root Directory (If Needed)

If Railway is still not using your commands:

1. Railway Dashboard → `member-api` → **Settings**
2. Click **"Source"** link in right sidebar
3. Look for **"Root Directory"** or **"Working Directory"**
4. Set it to: `fitness-dance-backend` (project root)
5. Save

---

## 🔄 Step 5: Redeploy

After setting the commands:

1. Railway Dashboard → `member-api` service
2. Click **"Deployments"** tab
3. Click **"Redeploy"** or **"Deploy"** button
4. Or trigger a new deployment by making a small change

---

## 🎯 Alternative: Create railway.json

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

**Note:** This applies to ALL services. If you have both admin-api and member-api, you might need separate configs or use service-specific settings in dashboard.

---

## 🔍 Verify Commands Are Set

**Check in Railway Dashboard:**

1. `member-api` → **Settings** → **Build** tab
   - Should show your custom build command
2. `member-api` → **Settings** → **Deploy** tab
   - Should show your custom start command

**If they're empty or show defaults, Railway will use auto-detection!**

---

## 🚨 Why This Happens

- **Railpack Auto-Detection:** Railway tries to auto-detect your app type
- **Default Behavior:** If no custom commands are set, it uses defaults
- **Default Start:** `node index.js` (which doesn't exist in your structure)
- **Solution:** Explicitly set build and start commands

---

## 📋 Quick Checklist

- [ ] `member-api` service created
- [ ] Build Command set: `cd member-api && npm install && cd .. && npx prisma generate && cd member-api && npm run build`
- [ ] Start Command set: `cd member-api && npm start`
- [ ] Commands saved in Railway Dashboard
- [ ] Service redeployed
- [ ] Check logs for successful start

---

## 💡 Pro Tip

**Always set build and start commands BEFORE first deployment!**

Railway's auto-detection works for simple apps, but for monorepos with custom structures, you must set explicit commands.

---

**Set the commands in Railway Dashboard, then redeploy!** 🚀
