# Update Railway Build Command ✅

**You found the right place! Update the "Custom Build Command" field.**

---

## 🎯 Fix Build Command (Image 3 - Build Tab)

### **Current (WRONG):**

```
npx prisma migrate deploy
```

### **Correct (RIGHT):**

```
cd admin-api && npm install && npm run build && cd .. && npx prisma generate
```

---

## 📝 Step-by-Step Instructions

### **Step 1: Open Build Tab**

1. Railway Dashboard → `admin-api` service
2. Click **"Settings"** tab (you're already there)
3. On the right sidebar, click **"Build"** link
4. Or scroll to find **"Custom Build Command"** section

### **Step 2: Update Build Command**

1. Find the **"Custom Build Command"** input field
2. **Clear** the current value: `npx prisma migrate deploy`
3. **Paste** this command:
   ```
   cd admin-api && npm install && npm run build && cd .. && npx prisma generate
   ```
4. Click **"Save"** or the field will auto-save

### **Step 3: Verify Start Command (Image 2)**

Make sure **"Custom Start Command"** (from Deploy tab) is:

```
cd admin-api && npm start
```

(This looks correct in your screenshot ✅)

---

## ✅ What Each Command Does

**Build Command:**

- `cd admin-api` - Go to admin-api folder
- `npm install` - Install dependencies
- `npm run build` - Compile TypeScript to JavaScript
- `cd ..` - Go back to root folder
- `npx prisma generate` - Generate Prisma Client types

**Start Command:**

- `cd admin-api` - Go to admin-api folder
- `npm start` - Run the built JavaScript file

**Migrations:** Run separately AFTER deployment (not in build!)

---

## 🚀 After Saving

1. Railway will automatically **redeploy** your service
2. Wait for deployment to complete (check "Deployments" tab)
3. Once service is **"Online"** (green), run migrations separately

---

## 📋 Run Migrations After Deployment

**Option 1: SQL Direct (Easiest)**

1. Railway Dashboard → `Postgres` service
2. Click **"Data"** or **"Query"** tab
3. Run:

   ```sql
   ALTER TABLE "users"
   ADD COLUMN IF NOT EXISTS "address" TEXT,
   ADD COLUMN IF NOT EXISTS "weight" DOUBLE PRECISION;

   CREATE INDEX IF NOT EXISTS "users_display_name_idx" ON "users"("display_name");
   CREATE INDEX IF NOT EXISTS "users_deleted_at_idx" ON "users"("deleted_at");
   ```

**Option 2: Shell Command**

1. Railway Dashboard → `admin-api` → **"Deployments"**
2. Click latest deployment → **"Shell"** or **"Terminal"**
3. Run:
   ```bash
   cd /app
   npx prisma migrate deploy
   ```

---

## 🎯 Summary

**Two Commands to Set:**

1. **Build Command** (Build tab):

   ```
   cd admin-api && npm install && npm run build && cd .. && npx prisma generate
   ```

2. **Start Command** (Deploy tab):
   ```
   cd admin-api && npm start
   ```

**Migrations:** Run separately after deployment! ✅

---

**Update the Build Command now, and Railway will redeploy automatically!** 🚀
