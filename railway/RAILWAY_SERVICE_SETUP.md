# Railway Service Setup - Step by Step 📋

**You've created the service! Now let's configure it.**

---

## 🎯 Current Status

✅ Postgres database is online  
✅ New service created (currently named "alluring-intuition")  
⏳ Need to configure and deploy

---

## 📝 Step-by-Step Configuration

### **Step 1: Rename Service (Optional but Recommended)**

1. Click on the "alluring-intuition" service card
2. Click on the service name or settings icon
3. Rename to: `admin-api`
4. Save

---

### **Step 2: Configure Service Settings**

1. **Click on the service card** (alluring-intuition or admin-api)

2. **Go to Settings tab** (or click the gear icon)

3. **Set Root Directory:**

   - Leave empty (default)
   - Or set to: `.` (current directory)

4. **Set Build Command:**

   ```
   cd admin-api && npm install && npm run build && cd .. && npx prisma generate
   ```

5. **Set Start Command:**

   ```
   cd admin-api && npm start
   ```

6. **Save settings**

---

### **Step 3: Set Environment Variables**

1. **Click on the service card**

2. **Go to Variables tab**

3. **Add these variables one by one:**

   **Database (Auto-inject from Postgres):**

   ```
   DATABASE_URL = ${{Postgres.DATABASE_URL}}
   ```

   **JWT Secrets:**

   ```
   JWT_SECRET = HejG/cnFmlH0nk9PHTQldal8Ch95HvHpmAamKi7/UZM=
   JWT_REFRESH_SECRET = C5ESO/8ncaOJUW471YN8GkhFJtxm9e4RkQmR6nQL8YQ=
   ```

   **JWT Expiration:**

   ```
   JWT_EXPIRES_IN = 30m
   JWT_REFRESH_EXPIRES_IN = 7d
   ```

   **Server:**

   ```
   NODE_ENV = production
   CORS_ORIGIN = *
   PORT = 3002
   ```

4. **Save all variables**

---

### **Step 4: Deploy**

**Option A: Using Dashboard**

1. Click "Deploy" button at the top (purple button with ↑ arrow)
2. Or click "Apply 1 change" button

**Option B: Using CLI**

```bash
cd D:\Zumba\fitness-dance-backend
railway up
```

---

### **Step 5: Run Database Migrations**

After deployment, run migrations:

**In Railway Dashboard:**

1. Go to your service
2. Click "Deployments" tab
3. Click on latest deployment
4. Click "Run Command"
5. Enter: `npx prisma migrate deploy`
6. Click "Run"

**Or using CLI:**

```bash
railway run npx prisma migrate deploy
```

---

## 🎯 Quick Checklist

- [ ] Service created (✅ Done - "alluring-intuition")
- [ ] Rename service to "admin-api" (optional)
- [ ] Set Build Command
- [ ] Set Start Command
- [ ] Set environment variables (7 variables)
- [ ] Click "Deploy"
- [ ] Run migrations
- [ ] Test health endpoint

---

## 💡 Tips

1. **DATABASE_URL:** Use `${{Postgres.DATABASE_URL}}` to auto-inject from Postgres service
2. **Build Command:** Must include Prisma generate since schema is in parent directory
3. **Start Command:** Runs the built JavaScript from `dist/` folder
4. **Deploy:** Railway will automatically build and start your service

---

## 🚨 Common Issues

**If deployment fails:**

- Check the "Logs" tab for error messages
- Verify build command is correct
- Ensure all environment variables are set
- Check that `admin-api/package.json` exists

**If database connection fails:**

- Verify `DATABASE_URL` is set correctly
- Use `${{Postgres.DATABASE_URL}}` format
- Check Postgres service is online

---

**Ready to configure!** Follow the steps above. 🚀
