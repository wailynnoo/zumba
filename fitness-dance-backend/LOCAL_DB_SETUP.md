# Local PostgreSQL Database Setup

**Status:** PostgreSQL installed at `D:\PostgreSQL\16\bin\psql.exe` ✅

---

## 🚀 Quick Setup Steps

### **Step 1: Create Database**

Open PowerShell and run:

```bash
# Connect to PostgreSQL
& "D:\PostgreSQL\16\bin\psql.exe" -U postgres

# If it asks for password, enter your PostgreSQL password
```

**Or use full path with password:**

```bash
# Set PostgreSQL password as environment variable (optional)
$env:PGPASSWORD="your_password"

# Connect
& "D:\PostgreSQL\16\bin\psql.exe" -U postgres
```

**Once connected, run:**

```sql
-- Create database
CREATE DATABASE fitness_dance_dev;

-- Verify it was created
\l

-- Exit
\q
```

---

### **Step 2: Get Connection String**

Your connection string format:

```
postgresql://postgres:YOUR_PASSWORD@localhost:5432/fitness_dance_dev?schema=public
```

**Replace:**

- `YOUR_PASSWORD` - Your PostgreSQL postgres user password
- `5432` - Default port (change if different)
- `fitness_dance_dev` - Database name we just created

---

### **Step 3: Add to .env Files**

**Root `.env` file:**

```bash
cd fitness-dance-backend
```

Edit `.env` file:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/fitness_dance_dev?schema=public
```

**Member API `.env`:**

```bash
cd member-api
```

Edit `.env` file (same DATABASE_URL):

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/fitness_dance_dev?schema=public
```

**Admin API `.env`:**

```bash
cd admin-api
```

Edit `.env` file (same DATABASE_URL):

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/fitness_dance_dev?schema=public
```

---

## ✅ Test Connection

### **Option 1: Quick Test Script**

Create: `fitness-dance-backend/test-db-connection.ts`

```typescript
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function testConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Database connection successful!");

    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Database query successful!", result);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();
```

**Run it:**

```bash
cd fitness-dance-backend
npx ts-node test-db-connection.ts
```

### **Option 2: Direct psql Test**

```bash
& "D:\PostgreSQL\16\bin\psql.exe" -U postgres -d fitness_dance_dev -c "SELECT version();"
```

---

## 🎯 After Connection Works

### **1. Create Migration**

```bash
cd fitness-dance-backend
npx prisma migrate dev --name init
```

This will:

- Create all 26 tables
- Create migration files
- Generate Prisma Client

### **2. Open Prisma Studio (Optional)**

View your database in a GUI:

```bash
npx prisma studio
```

Opens at: http://localhost:5555

---

## 🔧 Troubleshooting

### **Error: "password authentication failed"**

**Solution:**

- Check password in connection string
- Try resetting PostgreSQL password:
  ```bash
  & "D:\PostgreSQL\16\bin\psql.exe" -U postgres
  ALTER USER postgres WITH PASSWORD 'new_password';
  ```

### **Error: "database does not exist"**

**Solution:**

- Make sure you created the database:
  ```sql
  CREATE DATABASE fitness_dance_dev;
  ```

### **Error: "connection refused"**

**Solution:**

- Check if PostgreSQL service is running:
  ```powershell
  Get-Service postgresql*
  ```
- Start service if needed:
  ```powershell
  Start-Service postgresql-x64-16
  ```

### **Error: "psql: command not found"**

**Solution:**

- Use full path: `D:\PostgreSQL\16\bin\psql.exe`
- Or add to PATH environment variable

---

## 📋 Quick Checklist

- [ ] PostgreSQL service is running
- [ ] Created `fitness_dance_dev` database
- [ ] Know your PostgreSQL password
- [ ] Added DATABASE_URL to root `.env`
- [ ] Added DATABASE_URL to member-api `.env`
- [ ] Added DATABASE_URL to admin-api `.env`
- [ ] Tested connection
- [ ] Ready to create migration

---

**Ready to set up? Let me know if you need help with any step!**
