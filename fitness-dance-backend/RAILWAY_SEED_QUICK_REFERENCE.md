# Railway Database Seed Quick Reference 🌱

**Working Solution:** Run seed script via Railway CLI with TCP proxy connection.

---

## ✅ Quick Steps (Works Every Time)

### **1. Make Sure You're Linked**

```powershell
railway link
```

Select:

- Workspace: Your workspace
- Project: `fitness-dance-backend`
- Environment: `production`
- Service: `admin-api` (or skip with Esc)

### **2. Run Seed Script**

```powershell
railway run --service admin-api npx tsx prisma/seed.ts
```

**That's it!** The script will:

- ✅ Connect to Railway database via TCP proxy
- ✅ Seed all initial data (dance styles, intensity levels, categories, plans, roles, admin)
- ✅ Create Super Admin account

---

## 📋 What Gets Seeded

1. **Dance Styles** (5)

   - Zumba Fitness Dance
   - Bollywood Dance
   - K-pop Fitness Dance
   - Dance Choreography
   - TikTok Dance Basic

2. **Intensity Levels** (2)

   - Slow & Low Intensity
   - Fast & High Intensity

3. **Video Categories** (3)

   - Full Workout
   - Tutorial
   - Quick Session

4. **Subscription Plans** (4)

   - 1 Month (10,000 MMK)
   - 3 Months (27,000 MMK, 10% discount)
   - 6 Months (48,000 MMK, 20% discount)
   - 1 Year (84,000 MMK, 30% discount)

5. **Admin Roles** (4)

   - Super Admin (full access)
   - Content Manager (videos, categories, knowledge)
   - User Manager (users, subscriptions)
   - Support (feedback, read-only access)

6. **Super Admin Account**
   - Email: `admin@zfitdance.com`
   - Password: `Admin@123` (change in production!)
   - Role: Super Admin

---

## 🔧 How It Works

1. **Script Location:** `prisma/seed.ts`
2. **Connection:** Uses Railway's TCP proxy (`RAILWAY_TCP_PROXY_DOMAIN` + `RAILWAY_TCP_PROXY_PORT`)
3. **TypeScript Execution:** Uses `tsx` to run TypeScript directly
4. **Prisma Client:** Uses Prisma Client with pg adapter

---

## ⚠️ Important Notes

- **Safe to Re-run:** Uses `upsert` operations, so running multiple times won't create duplicates
- **TCP Proxy:** Automatically uses Railway's public TCP proxy when internal URL is detected
- **Environment Variables:** Railway CLI automatically provides `DATABASE_URL`, `RAILWAY_TCP_PROXY_DOMAIN`, etc.
- **Super Admin Password:** Default is `Admin@123` - **change this in production!**

---

## 🎯 Why This Works

1. **Railway CLI** runs commands in Railway's environment with access to all environment variables
2. **TCP Proxy** allows connection from local machine to Railway's internal database
3. **tsx** runs TypeScript files directly without compilation
4. **Upsert Operations** make it safe to run multiple times

---

## 📝 Command Reference

```powershell
# Link to project (first time only)
railway link

# Run seed script
railway run --service admin-api npx tsx prisma/seed.ts

# Verify seed (optional)
railway run --service admin-api npx tsx prisma/verify-seed.ts
```

---

## ✅ Success Output

You should see:

```
📡 Using TCP proxy connection (public URL)
🌱 Starting seed...

📝 Seeding Dance Styles...
✅ Created 5 dance styles

📝 Seeding Intensity Levels...
✅ Created 2 intensity levels

📝 Seeding Video Categories...
✅ Created 3 video categories

📝 Seeding Subscription Plans...
✅ Created 4 subscription plans

📝 Seeding Admin Roles...
✅ Created 4 admin roles

📝 Creating Super Admin account...
✅ Created Super Admin: admin@zfitdance.com
   Password: Admin@123 (change this in production!)

🎉 Seed completed successfully!
```

---

## 🔐 Change Super Admin Password

To use a custom password, set the environment variable:

```powershell
# Set password before running seed
$env:SUPER_ADMIN_PASSWORD="YourSecurePassword123!"

# Run seed
railway run --service admin-api npx tsx prisma/seed.ts
```

Or set it in Railway Dashboard:

1. Go to `admin-api` service → **Variables**
2. Add: `SUPER_ADMIN_PASSWORD=YourSecurePassword123!`
3. Run seed again

---

**✅ This solution works reliably for seeding Railway database!**
