# Fix Railway "can't cd to admin-api" Error 🔧

**Error:** `sh: 1: cd: can't cd to admin-api`

**Problem:** Railway is trying to run `cd admin-api` but the directory doesn't exist at that path. This happens when Railway's Root Directory is set incorrectly.

---

## ✅ Solution: Configure Root Directory in Railway

### **Option 1: Set Root Directory in Railway Dashboard (Recommended)**

1. **Go to Railway Dashboard**
   - https://railway.app/dashboard
   - Select your project
   - Click on **`admin-api`** service

2. **Go to Settings → General**
   - Click **"Settings"** tab
   - Scroll to **"Root Directory"** field

3. **Set Root Directory**
   - Enter: `fitness-dance-backend`
   - Click **"Save"** (or wait for auto-save)

4. **Verify Build Command**
   - Go to **"Settings"** → **"Build"** tab
   - **Custom Build Command** should be:
     ```
     cd admin-api && npm install && cd .. && npx prisma generate --schema=prisma/schema.prisma && cd admin-api && npm run build
     ```
   - Or (simpler version):
     ```
     cd admin-api && npm install && npm run build
     ```

5. **Verify Start Command**
   - Go to **"Settings"** → **"Deploy"** tab
   - **Custom Start Command** should be:
     ```
     cd admin-api && npm start
     ```

---

### **Option 2: Update Build Command to Use Full Path**

If you can't change the Root Directory, update the build command to work from repository root:

1. **Go to Railway Dashboard** → `admin-api` → **Settings** → **Build**

2. **Update Build Command** to:
   ```
   cd fitness-dance-backend/admin-api && npm install && cd ../.. && npx prisma generate --schema=fitness-dance-backend/prisma/schema.prisma && cd fitness-dance-backend/admin-api && npm run build
   ```

3. **Update Start Command** to:
   ```
   cd fitness-dance-backend/admin-api && npm start
   ```

---

## 🎯 Recommended Configuration

**Root Directory:** `fitness-dance-backend`

**Build Command:**
```bash
cd admin-api && npm install && cd .. && npx prisma generate --schema=prisma/schema.prisma && cd admin-api && npm run build
```

**Start Command:**
```bash
cd admin-api && npm start
```

---

## 📋 Project Structure

Your repository structure:
```
zumba/
├── fitness-dance-backend/
│   ├── admin-api/          ← Service code here
│   ├── admin-web/
│   ├── member-api/
│   └── prisma/              ← Prisma schema here
│       └── schema.prisma
└── ...
```

**Railway Root Directory should be:** `fitness-dance-backend`

This ensures:
- ✅ `cd admin-api` works (from `fitness-dance-backend`)
- ✅ `prisma/schema.prisma` is accessible (from `fitness-dance-backend`)
- ✅ All paths in build commands are correct

---

## ✅ After Fixing

1. **Save settings in Railway dashboard**
2. **Redeploy:**
   - Railway will automatically redeploy
   - Or click "Deploy" button
   - Or run: `railway up` (from repository root)

3. **Check build logs:**
   - Should see: `cd admin-api` succeeds
   - Should see: `npm install` runs
   - Should see: Prisma client generation
   - Should see: TypeScript compilation succeeds

---

## 🔍 Verify Root Directory Setting

**In Railway Dashboard:**
1. Go to `admin-api` service → **Settings** → **General**
2. Look for **"Root Directory"** field
3. Should be: `fitness-dance-backend` (not empty, not `admin-api`)

**If Root Directory is empty or wrong:**
- Railway runs from repository root (`zumba/`)
- `cd admin-api` fails because path is `zumba/admin-api` (doesn't exist)
- Correct path is `zumba/fitness-dance-backend/admin-api`

---

**After setting Root Directory to `fitness-dance-backend`, the build should succeed!** 🚀

