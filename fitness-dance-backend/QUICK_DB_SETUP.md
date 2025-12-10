# Quick Database Setup - Local PostgreSQL

**Status:** ✅ PostgreSQL installed and running!

---

## 🚀 Quick Setup (3 Steps)

### **Step 1: Create Database**

**Option A: Using psql (Recommended)**

```powershell
# Connect to PostgreSQL
& "D:\PostgreSQL\16\bin\psql.exe" -U postgres

# Then run:
CREATE DATABASE fitness_dance_dev;

# Verify
\l

# Exit
\q
```

**Option B: Using SQL File**

```powershell
& "D:\PostgreSQL\16\bin\psql.exe" -U postgres -f create-database.sql
```

---

### **Step 2: Add Connection String to .env Files**

**Format:**

```
postgresql://postgres:YOUR_PASSWORD@localhost:5432/fitness_dance_dev?schema=public
```

**Add to these 3 files:**

1. **Root `.env`** (`fitness-dance-backend/.env`)
2. **Member API `.env`** (`fitness-dance-backend/member-api/.env`)
3. **Admin API `.env`** (`fitness-dance-backend/admin-api/.env`)

**Example:**

```env
DATABASE_URL=postgresql://postgres:mypassword123@localhost:5432/fitness_dance_dev?schema=public
```

⚠️ **Important:** Replace `mypassword123` with your actual PostgreSQL password!

---

### **Step 3: Test Connection**

```bash
cd fitness-dance-backend
npx ts-node test-db-connection.ts
```

**Expected Output:**

```
🔌 Attempting to connect to database...
✅ Database connection successful!
✅ Database query successful!
✅ Disconnected successfully
```

---

## ✅ After Connection Works

### **Create Migration (Create All Tables)**

```bash
cd fitness-dance-backend
npx prisma migrate dev --name init
```

This will:

- ✅ Create all 26 tables
- ✅ Create migration files
- ✅ Generate Prisma Client

---

## 🎯 Quick Commands

### **Create Database:**

```powershell
& "D:\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE fitness_dance_dev;"
```

### **Test Connection:**

```bash
npx ts-node test-db-connection.ts
```

### **Create Migration:**

```bash
npx prisma migrate dev --name init
```

### **Open Database GUI:**

```bash
npx prisma studio
```

---

## 🔧 Need Help?

**Don't know your PostgreSQL password?**

- Try the default password you set during installation
- Or reset it:
  ```sql
  ALTER USER postgres WITH PASSWORD 'new_password';
  ```

**Connection fails?**

- Check if service is running: `Get-Service postgresql-x64-16`
- Check if database exists: `\l` in psql
- Check password in connection string

---

**Ready to create the database?** Let me know when you've added the DATABASE_URL to your .env files!
