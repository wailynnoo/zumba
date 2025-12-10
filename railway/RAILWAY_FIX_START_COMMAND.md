# Fix Railway Start Command Error 🔧

**Error:** `Cannot find module '/app/index.js'`

**Problem:** Railway is trying to run `node index.js` but the file is at `admin-api/dist/index.js`

---

## ✅ Solution: Update Railway Settings

### **Step 1: Go to Railway Dashboard**

1. Open: https://railway.app/dashboard
2. Open your project: `fitness-dance-backend`
3. Click on `admin-api` service
4. Click "Settings" tab

### **Step 2: Update Build Command**

**Set Build Command to:**

```bash
cd admin-api && npm install && npm run build && cd .. && npx prisma generate
```

### **Step 3: Update Start Command**

**Set Start Command to:**

```bash
cd admin-api && npm start
```

**OR:**

```bash
cd admin-api && node dist/index.js
```

### **Step 4: Set Root Directory (Optional)**

**Root Directory:** Leave empty (or set to `.`)

**OR if Railway needs it:**

- Set to: `admin-api`

---

## 🔍 Why This Happened

Railway auto-detected the project and used default commands:

- Default start: `node index.js` ❌
- Should be: `cd admin-api && node dist/index.js` ✅

---

## ✅ After Updating Settings

1. **Save the settings**
2. **Redeploy:**
   - Click "Deploy" button in Railway dashboard
   - Or run: `railway up` (select admin-api)

---

## 🎯 Quick Fix Checklist

- [ ] Go to Railway Dashboard → admin-api → Settings
- [ ] Set Build Command: `cd admin-api && npm install && npm run build && cd .. && npx prisma generate`
- [ ] Set Start Command: `cd admin-api && npm start`
- [ ] Save settings
- [ ] Click "Deploy" or run `railway up`

---

**After fixing, the deployment should work!** 🚀
