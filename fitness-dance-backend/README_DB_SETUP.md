# Database Setup - Quick Guide

**PostgreSQL:** ✅ Installed and running at `D:\PostgreSQL\16`

---

## 🚀 3 Simple Steps

### **Step 1: Create Database**

**Run this command:**

```powershell
& "D:\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE fitness_dance_dev;"
```

**Or use the script:**

```powershell
.\SETUP_DATABASE.ps1
```

You'll be prompted for your PostgreSQL password.

---

### **Step 2: Add DATABASE_URL to .env Files**

**Connection String Format:**

```
postgresql://postgres:YOUR_PASSWORD@localhost:5432/fitness_dance_dev?schema=public
```

**Add to 3 files:**

1. `fitness-dance-backend/.env`
2. `fitness-dance-backend/member-api/.env`
3. `fitness-dance-backend/admin-api/.env`

**Example:**

```env
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/fitness_dance_dev?schema=public
```

⚠️ Replace `mypassword` with your actual PostgreSQL password!

---

### **Step 3: Test & Create Migration**

**Test connection:**

```bash
npx ts-node test-db-connection.ts
```

**Create migration (creates all 26 tables):**

```bash
npx prisma migrate dev --name init
```

---

## ✅ That's It!

After migration, you'll have:

- ✅ All 26 tables created
- ✅ Database ready for development
- ✅ Ready to seed data and build features

---

**Need help?** Check `LOCAL_DB_SETUP.md` for detailed instructions.
