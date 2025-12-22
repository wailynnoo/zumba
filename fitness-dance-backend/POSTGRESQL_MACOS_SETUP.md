# PostgreSQL Setup for macOS

**Status:** ✅ PostgreSQL 14 installed and running!

---

## 🚀 Quick Setup Steps

### **Step 1: Set PostgreSQL Password (if needed)**

By default, Homebrew PostgreSQL uses your macOS username as the superuser **without a password**. You have two options:

#### **Option A: Use Current User (No Password) - Easiest**

```bash
# Check your current macOS username
whoami

# Connect to PostgreSQL (no password needed)
psql postgres
```

#### **Option B: Set Password for postgres User (Recommended for Production)**

```bash
# Connect as your macOS user
psql postgres

# Then run these SQL commands:
ALTER USER postgres WITH PASSWORD 'your_secure_password';
# Or create a new user:
CREATE USER fitness_dance_user WITH PASSWORD 'your_secure_password';
ALTER USER fitness_dance_user CREATEDB;

# Exit
\q
```

---

### **Step 2: Create Database**

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE fitness_dance_dev;

# Verify it was created
\l

# Exit
\q
```

**Or use command line:**

```bash
# Using current macOS user (no password)
createdb fitness_dance_dev

# Or using postgres user with password
PGPASSWORD=your_password psql -U postgres -c "CREATE DATABASE fitness_dance_dev;"
```

---

### **Step 3: Create .env Files**

#### **Root `.env` file:**

Create: `fitness-dance-backend/.env`

```env
# Database
DATABASE_URL=postgresql://YOUR_USERNAME@localhost:5432/fitness_dance_dev?schema=public

# If using password:
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/fitness_dance_dev?schema=public
```

#### **Member API `.env`:**

Create: `fitness-dance-backend/member-api/.env`

```env
# Database
DATABASE_URL=postgresql://YOUR_USERNAME@localhost:5432/fitness_dance_dev?schema=public

# If using password:
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/fitness_dance_dev?schema=public
```

#### **Admin API `.env`:**

Create: `fitness-dance-backend/admin-api/.env`

```env
# Database
DATABASE_URL=postgresql://YOUR_USERNAME@localhost:5432/fitness_dance_dev?schema=public

# If using password:
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/fitness_dance_dev?schema=public
```

**Replace:**
- `YOUR_USERNAME` - Your macOS username (run `whoami` to find it)
- `YOUR_PASSWORD` - Only if you set a password

---

### **Step 4: Test Connection**

```bash
cd fitness-dance-backend

# Test with psql
psql fitness_dance_dev

# If successful, you'll see:
# psql (14.20)
# Type "help" for help.
# fitness_dance_dev=#

# Exit
\q
```

---

### **Step 5: Run Prisma Migration**

```bash
cd fitness-dance-backend

# Generate Prisma client
npx prisma generate

# Create migration (creates all tables)
npx prisma migrate dev --name init
```

---

## 🎯 Quick Commands Reference

### **Connect to PostgreSQL:**
```bash
psql postgres
# or
psql fitness_dance_dev
```

### **List all databases:**
```bash
psql postgres -c "\l"
```

### **Create database:**
```bash
createdb fitness_dance_dev
```

### **Drop database (if needed):**
```bash
dropdb fitness_dance_dev
```

### **Check PostgreSQL status:**
```bash
brew services list | grep postgresql
```

### **Restart PostgreSQL:**
```bash
brew services restart postgresql@14
```

---

## ✅ Example Connection Strings

### **No Password (Default macOS Setup):**
```
postgresql://mac@localhost:5432/fitness_dance_dev?schema=public
```

### **With Password:**
```
postgresql://postgres:yourpassword@localhost:5432/fitness_dance_dev?schema=public
```

### **Custom User with Password:**
```
postgresql://fitness_dance_user:yourpassword@localhost:5432/fitness_dance_dev?schema=public
```

---

## 🔧 Troubleshooting

### **Error: "role does not exist"**
```bash
# Create role matching your macOS username
psql postgres -c "CREATE ROLE $(whoami) WITH LOGIN SUPERUSER;"
```

### **Error: "database does not exist"**
```bash
# Create database
createdb fitness_dance_dev
```

### **Error: "connection refused"**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start if not running
brew services start postgresql@14
```

---

**Ready to go!** 🚀

