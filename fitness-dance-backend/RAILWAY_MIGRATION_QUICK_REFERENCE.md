# Railway Migration Quick Reference 🚀

**Working Solution:** Run migrations via Node.js script using Railway CLI with TCP proxy connection.

> **🌱 Need to seed the database?** See [RAILWAY_SEED_QUICK_REFERENCE.md](./RAILWAY_SEED_QUICK_REFERENCE.md)

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
- Service: `Postgres` (or skip with Esc)

### **2. Run Migration Script**

**IMPORTANT: Run via Postgres service (not admin-api) to get TCP proxy variables automatically:**

```powershell
railway run --service Postgres node run-migration.js
```

> **Why Postgres service?** Railway CLI automatically provides `RAILWAY_TCP_PROXY_DOMAIN` and `RAILWAY_TCP_PROXY_PORT` when running via the Postgres service, which are required to connect to the database from your local machine.

**That's it!** The script will:

- ✅ Connect to Railway database via TCP proxy
- ✅ Execute all SQL statements
- ✅ Handle errors gracefully (skips if already applied)
- ✅ Record migration in `_prisma_migrations` table
- ✅ Verify tables were created

---

## 📋 How It Works

1. **Script Location:** `run-migration.js` (in project root)
2. **Connection:** Uses Railway's TCP proxy (`RAILWAY_TCP_PROXY_DOMAIN` + `RAILWAY_TCP_PROXY_PORT`)
3. **SQL Source:** Reads from `prisma/migrations/[migration_name]/migration.sql`
4. **Fallback:** Uses inline SQL if file not found (for Railway deployments without migration files)

---

## 🔧 For New Migrations

### **Option 1: Use Existing Script (Recommended)**

The script is hardcoded for `20241206120000_add_refresh_token_security`. For new migrations:

1. **Update the script** to read the new migration file:

   ```javascript
   const migrationPath = path.join(
     __dirname,
     "prisma",
     "migrations",
     "YOUR_NEW_MIGRATION_NAME",
     "migration.sql"
   );
   ```

2. **Update migration name** in verification:
   ```javascript
   WHERE migration_name = 'YOUR_NEW_MIGRATION_NAME';
   ```

### **Option 2: Make Script Generic**

Modify `run-migration.js` to accept migration name as argument:

```javascript
const migrationName =
  process.argv[2] || "20241206120000_add_refresh_token_security";
```

Then run:

```powershell
railway run --service Postgres node run-migration.js YOUR_NEW_MIGRATION_NAME
```

---

## ⚠️ Important Notes

- **No Git Required:** Works even if Railway doesn't deploy `prisma/migrations` folder
- **Safe to Re-run:** Script handles "already exists" errors gracefully
- **TCP Proxy:** Automatically uses Railway's public TCP proxy when internal URL is detected
- **Service:** Must run via `Postgres` service (not `admin-api`) to get `RAILWAY_TCP_PROXY_DOMAIN` and `RAILWAY_TCP_PROXY_PORT` automatically
- **Environment Variables:** Railway CLI automatically provides `DATABASE_URL`, `RAILWAY_TCP_PROXY_DOMAIN`, etc. when running via Postgres service

---

## 🎯 Why This Works

1. **Railway CLI** runs commands in Railway's environment with access to all environment variables
2. **TCP Proxy** allows connection from local machine to Railway's internal database
3. **Node.js + pg** library executes SQL directly without needing Prisma Client
4. **Error Handling** makes it safe to run multiple times

---

## 📝 Command Reference

```powershell
# Link to project (first time only)
railway link

# Run migration (IMPORTANT: Use Postgres service for TCP proxy variables)
railway run --service Postgres node run-migration.js

# Check migration status (after running)
railway run --service Postgres npx prisma migrate status

# View Railway variables (for debugging)
railway variables --service Postgres
railway variables --service admin-api
```

---

## ✅ Success Output

You should see:

```
📡 Using TCP proxy connection: nozomi.proxy.rlwy.net:56096
🚀 Starting migration: 20250113000000_remove_dance_style_intensity_youtube
📡 Connecting to database...
✅ Connected to database
✅ Found migration SQL file
📝 Executing 3 SQL statements...
✅ Statement 1/3 executed
✅ Statement 2/3 executed
✅ Statement 3/3 executed
✅ Migration completed successfully!
✅ Columns dance_style_id, intensity_level_id, youtube_video_id successfully removed
✅ Migration recorded in _prisma_migrations
```

---

**✅ This solution works reliably for Railway database migrations!**

**✅ This solution works reliably for Railway database migrations!**

---

**✅ This solution works reliably for Railway database migrations!**

**✅ This solution works reliably for Railway database migrations!**
