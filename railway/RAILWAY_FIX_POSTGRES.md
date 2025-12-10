# Fix Postgres Database Crash 🗄️

**Error:** `Error: Cannot find module '/app/index.js'` in Postgres service

**Problem:** Postgres service has a Node.js start command configured (wrong!)

**Solution:** Remove the start command from Postgres service.

---

## ✅ Fix Postgres Service

### **Step 1: Check Postgres Settings**

1. **Railway Dashboard** → `Postgres` service
2. Click **"Settings"** tab
3. Click **"Deploy"** link (right sidebar)
4. Check **"Custom Start Command"** field

**If it shows something like:**

```
cd member-api && npm start
```

or

```
node index.js
```

**That's the problem!** Postgres shouldn't have a start command.

---

## 🔧 Step 2: Remove Start Command

1. **Railway Dashboard** → `Postgres` → **Settings** → **Deploy**
2. Find **"Custom Start Command"** field
3. **Delete/clear** the command (leave it empty)
4. **Save**

**Postgres is a managed database - it doesn't need a start command!**

---

## 🔄 Step 3: Restart Postgres

1. **Railway Dashboard** → `Postgres` service
2. Click **"Deployments"** tab
3. Click **"Redeploy"** or **"Restart"** button
4. Wait for it to start
5. Should show **"Online"** (green dot)

---

## 🎯 Alternative: Check if Postgres is Actually a Database Service

**If Postgres keeps crashing:**

1. **Railway Dashboard** → `Postgres` service
2. Check the service type
3. **Should be:** "PostgreSQL" database service
4. **Should NOT be:** "Empty Service" with Postgres installed manually

**If it's an "Empty Service":**

- You need to create a proper PostgreSQL database service
- Railway Dashboard → **"New"** → **"Database"** → **"Add PostgreSQL"**
- Then delete the old broken Postgres service

---

## ✅ Verify Postgres is Working

**After restarting:**

1. **Railway Dashboard** → `Postgres` service
2. Should show **"Online"** (green dot)
3. Click **"Database"** tab
4. Should show database tables
5. Both `admin-api` and `member-api` should be able to connect

---

## 🔍 Why This Happened

**Possible causes:**

1. **Accidental configuration:** Start command was set on Postgres by mistake
2. **Service type confusion:** Postgres was created as "Empty Service" instead of "Database"
3. **Deployment error:** Railway tried to deploy code to Postgres service

**Postgres is a managed database - it runs automatically, no start command needed!**

---

## 📋 Quick Fix Steps

1. ✅ Railway Dashboard → `Postgres` service
2. ✅ Settings → Deploy tab
3. ✅ Clear "Custom Start Command" (leave empty)
4. ✅ Save
5. ✅ Redeploy/Restart Postgres
6. ✅ Verify it's "Online"

---

## 🚨 If Postgres Still Crashes

**Option 1: Create New PostgreSQL Database**

1. Railway Dashboard → **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Name it: `Postgres` (or `postgres-new`)
3. Wait for it to be "Online"
4. Update `DATABASE_URL` in both services to use new database
5. Delete old broken Postgres service

**Option 2: Check Resource Limits**

1. Railway Dashboard → `Postgres` → **Settings**
2. Check if you've hit resource limits
3. Upgrade plan if needed

---

**Remove the start command from Postgres - it's a database, not a Node.js app!** 🎯
