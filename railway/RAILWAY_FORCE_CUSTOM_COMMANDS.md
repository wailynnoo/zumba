# Force Railway to Use Custom Commands 🚨

**Problem:** Railway is using Railpack auto-detection (`$ node index.js`) instead of your custom commands.

**Solution:** Railway needs explicit service configuration. Here are multiple solutions:

---

## ✅ Solution 1: Set Commands in Dashboard (MUST DO THIS FIRST)

**This is the most reliable method:**

### **For Member API:**

1. **Railway Dashboard** → `member-api` service
2. **Settings** → **Build** tab
3. **Custom Build Command** - Set to:
   ```
   cd member-api && npm install && cd .. && npx prisma generate && cd member-api && npm run build
   ```
4. **Settings** → **Deploy** tab
5. **Custom Start Command** - Set to:
   ```
   cd member-api && npm start
   ```
6. **SAVE BOTH** (click save or wait for auto-save)
7. **Refresh the page** and verify commands are still there

### **For Admin API:**

1. **Railway Dashboard** → `admin-api` service
2. **Settings** → **Build** tab
3. **Custom Build Command** - Set to:
   ```
   cd admin-api && npm install && cd .. && npx prisma generate && cd admin-api && npm run build
   ```
4. **Settings** → **Deploy** tab
5. **Custom Start Command** - Set to:
   ```
   cd admin-api && npm start
   ```
6. **SAVE BOTH**

---

## ✅ Solution 2: Deploy to Specific Service

**When using `railway up`, specify which service:**

```bash
# Deploy to member-api specifically
railway up --service member-api

# Deploy to admin-api specifically
railway up --service admin-api
```

**Or link to a specific service:**

```bash
# Link to member-api
railway link --service member-api
railway up

# Link to admin-api
railway link --service admin-api
railway up
```

---

## ✅ Solution 3: Disable Railpack Auto-Detection

**If Railway keeps using auto-detection:**

1. **Railway Dashboard** → `member-api` → **Settings**
2. Look for **"Use Metal Build Environment"** toggle
3. **Turn it ON** (this might disable Railpack)
4. Or look for **"Builder"** setting and change to **"NIXPACKS"**

---

## ✅ Solution 4: Use Railway Service-Specific Config

**Create service-specific config files:**

### **For Member API - Create `member-api/railway.json`:**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd .. && cd member-api && npm install && cd .. && npx prisma generate && cd member-api && npm run build"
  },
  "deploy": {
    "startCommand": "cd member-api && npm start"
  }
}
```

**Note:** This might not work if Railway deploys from root. Better to use Dashboard settings.

---

## 🎯 Recommended Approach

**Do ALL of these:**

1. ✅ **Set commands in Dashboard** (Solution 1) - MOST IMPORTANT
2. ✅ **Use `railway up --service <service-name>`** (Solution 2)
3. ✅ **Verify commands are saved** (refresh page and check)
4. ✅ **Redeploy from Dashboard** (not CLI)

---

## 🔍 How to Verify Commands Are Being Used

**After deployment, check build logs:**

**Should see:**

```
$ cd member-api && npm install && cd .. && npx prisma generate && cd member-api && npm run build
```

**Should NOT see:**

```
$ npm ci
$ node index.js
```

**If you see the wrong commands:** Railway is still using auto-detection!

---

## 🚨 Critical Steps

1. **Go to Railway Dashboard NOW**
2. **Check member-api Settings → Build → Custom Build Command**
   - Is it empty? → Set it!
   - Is it truncated? → Fix it!
   - Is it complete? → Verify it's saved!
3. **Check member-api Settings → Deploy → Custom Start Command**
   - Is it set? → Verify it!
4. **Do the same for admin-api**
5. **Redeploy from Dashboard** (click "Redeploy" button)

---

## 💡 Why This Happens

- **Railpack Auto-Detection:** Railway tries to be smart and auto-detect your app
- **Default Behavior:** If commands aren't explicitly set, it uses defaults
- **CLI vs Dashboard:** Sometimes CLI doesn't respect dashboard settings
- **Solution:** Always set commands in Dashboard FIRST, then deploy

---

## 📋 Action Items

- [ ] Go to Railway Dashboard
- [ ] Verify member-api Build Command is set (complete, not truncated)
- [ ] Verify member-api Start Command is set
- [ ] Verify admin-api Build Command is set
- [ ] Verify admin-api Start Command is set
- [ ] Redeploy from Dashboard (not CLI)
- [ ] Check build logs to confirm custom commands are running

---

**The Dashboard settings are the source of truth. Set them there first!** 🎯
