# Fix Postgres Database Service - Source Directory Issue 🗄️

**Problem:** Postgres is a Database service but still crashing with Node.js error.

**Root Cause:** Railway might be deploying your project code to the Postgres service (wrong source/root directory).

---

## 🔍 Check Source Configuration

### **Step 1: Check Postgres Source Settings**

1. **Railway Dashboard** → `Postgres` service
2. Click **"Settings"** tab
3. Click **"Source"** link (right sidebar)
4. Check **"Root Directory"** or **"Source"** setting

**If it shows:**

- ❌ `fitness-dance-backend` or any project folder → **This is wrong!**
- ✅ Empty or no source → **This is correct!**

**Database services shouldn't have a source directory!**

---

## ✅ Fix: Remove Source from Postgres

### **Step 1: Clear Source/Root Directory**

1. **Railway Dashboard** → `Postgres` → **Settings** → **Source**
2. Find **"Root Directory"** or **"Source"** field
3. **Clear/delete** any value (leave it empty)
4. **Save**

**Database services don't need source code - they run PostgreSQL automatically!**

---

## 🔍 Alternative: Check if Service is Connected to Repository

### **Step 1: Check Repository Connection**

1. **Railway Dashboard** → `Postgres` service
2. Click **"Settings"** tab
3. Click **"Source"** link
4. Check if there's a **"Repository"** or **"Git"** connection

**If connected to a repository:**

- Railway might be deploying code from the repo
- **Disconnect** the repository connection
- Database services don't need Git/repository connections

---

## 🎯 Why This Happens

**When a Database service has a source directory:**

- Railway thinks it needs to deploy code
- It tries to build and run the code
- It detects Node.js and tries to run `node index.js`
- This causes the error

**Database services should:**

- Have NO source directory
- Have NO repository connection
- Run PostgreSQL automatically
- Only need environment variables (if any)

---

## 📋 Quick Fix Steps

1. ✅ Railway Dashboard → `Postgres` → **Settings** → **Source**
2. ✅ Clear **"Root Directory"** (leave empty)
3. ✅ Disconnect repository if connected
4. ✅ Save
5. ✅ Restart/Redeploy Postgres service
6. ✅ Should show "Online" now

---

## 🔍 Verify Other Services

**Make sure your API services have correct source:**

**Admin API:**

- Settings → Source → Root Directory: `fitness-dance-backend` (or empty if deploying from root)
- Should have repository connection

**Member API:**

- Settings → Source → Root Directory: `fitness-dance-backend` (or empty if deploying from root)
- Should have repository connection

**Postgres:**

- Settings → Source → Root Directory: **EMPTY** ✅
- Should have **NO** repository connection ✅

---

## 🚨 If Still Crashing

**Option 1: Check Service Type Again**

1. Railway Dashboard → `Postgres` service
2. Look at service header/icon
3. Should show PostgreSQL elephant icon
4. Should say "PostgreSQL" or "Database"

**If it doesn't show database icon:** It might not be a proper database service.

**Option 2: Create Fresh Database**

1. Delete current Postgres service
2. Create new: **"New"** → **"Database"** → **"Add PostgreSQL"**
3. **Don't** set any source directory
4. **Don't** connect any repository
5. Update `DATABASE_URL` in both APIs

---

**The issue is likely the source directory - remove it from Postgres!** 🎯
