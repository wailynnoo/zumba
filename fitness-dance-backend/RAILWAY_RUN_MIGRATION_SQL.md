# Run Migration SQL via Railway CLI 🚀

**Problem:** Railway doesn't deploy `prisma/migrations` folder, and `railway connect` doesn't work.

**Solution:** Use Railway CLI to run a Node.js script that executes the SQL directly.

---

## ✅ Method: Run Migration Script via Railway CLI

### **Step 1: Make Sure You're Linked**

```powershell
railway link
```

Select:

- Workspace: Your workspace
- Project: `fitness-dance-backend`
- Environment: `production`
- Service: `admin-api` (or skip with Esc)

### **Step 2: Run Migration Script**

```powershell
railway run --service admin-api node run-migration.js
```

**Or if you're already in the admin-api service context:**

```powershell
railway run node ../run-migration.js
```

### **Step 3: Verify Migration**

After running, you should see output like:

```
🚀 Starting migration: 20241206120000_add_refresh_token_security
✅ Found migration SQL file (or using inline SQL)
📝 Executing X SQL statements...
✅ Statement 1/X executed
✅ Statement 2/X executed
...
✅ Migration completed successfully!
✅ admin_refresh_tokens table exists
✅ Migration recorded in _prisma_migrations
```

---

## 🔍 Alternative: Run via npm script

If the script is in the root, you can also run:

```powershell
railway run --service admin-api npm run migrate:run-sql
```

This requires the script to be accessible from the admin-api service.

---

## 📋 What the Script Does

1. **Reads migration SQL** from `prisma/migrations/20241206120000_add_refresh_token_security/migration.sql`
2. **If file not found**, uses inline SQL (safe for Railway deployments)
3. **Executes SQL statements** one by one
4. **Handles errors gracefully** (skips if table/index already exists)
5. **Records migration** in `_prisma_migrations` table
6. **Verifies** that tables were created successfully

---

## ⚠️ Important Notes

- **Safe to run multiple times:** The script uses `IF NOT EXISTS` and checks before creating
- **No data loss:** Only creates new tables and renames columns
- **Uses Prisma Client:** Requires `@prisma/client` to be installed
- **Works in Railway environment:** Has access to `DATABASE_URL` automatically

---

## 🎯 Quick Command Reference

```powershell
# Link to project (if not already linked)
railway link

# Run migration script
railway run --service admin-api node run-migration.js

# Check migration status (after running)
railway run --service admin-api npx prisma migrate status
```

---

**✅ This method works even when migration files aren't deployed to Railway!**
