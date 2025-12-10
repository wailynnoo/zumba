# Database Setup Guide

**Status:** Database not set up yet  
**Database Type:** PostgreSQL  
**Options:** Local, Supabase, or Railway

---

## 🎯 Database Options

### **Option 1: Local PostgreSQL (Development)** ⭐ Recommended for Development

**Pros:**

- ✅ Free
- ✅ Fast (no network latency)
- ✅ Full control
- ✅ Good for learning

**Cons:**

- ❌ Need to install PostgreSQL
- ❌ Only works on your machine

---

### **Option 2: Supabase (Cloud - Free Tier)** ⭐ Recommended for Quick Start

**Pros:**

- ✅ Free tier available
- ✅ Easy setup (5 minutes)
- ✅ Web dashboard included
- ✅ Automatic backups
- ✅ Works from anywhere
- ✅ Good for development and production

**Cons:**

- ❌ Requires internet connection
- ❌ Free tier has limits

**Free Tier Limits:**

- 500 MB database
- 2 GB bandwidth
- Unlimited API requests

---

### **Option 3: Railway (Cloud - Paid)**

**Pros:**

- ✅ Easy setup
- ✅ Good for production
- ✅ Automatic deployments

**Cons:**

- ❌ Paid service (starts at $5/month)
- ❌ More expensive than Supabase

---

## 🚀 Recommended: Supabase (Easiest & Free)

**Why Supabase?**

1. ✅ Free tier is generous for development
2. ✅ Takes 5 minutes to set up
3. ✅ Web dashboard for managing data
4. ✅ Can use same database for dev and production
5. ✅ Automatic backups

---

## 📝 Step-by-Step: Set Up Supabase

### **Step 1: Create Supabase Account**

1. Go to: https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (easiest) or email
4. Verify your email

### **Step 2: Create New Project**

1. Click "New Project"
2. Fill in:
   - **Name:** `fitness-dance-app` (or any name)
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose closest to you
   - **Pricing Plan:** Free
3. Click "Create new project"
4. Wait 2-3 minutes for setup

### **Step 3: Get Database Connection String**

1. Go to **Settings** → **Database**
2. Scroll to **Connection string**
3. Select **URI** tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your database password

**Example:**

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### **Step 4: Add to .env File**

**Root `.env` file:**

```bash
cd fitness-dance-backend
```

Edit `.env` file:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?schema=public
```

**Member API `.env`:**

```bash
cd member-api
```

Edit `.env` file (same DATABASE_URL):

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?schema=public
```

**Admin API `.env`:**

```bash
cd admin-api
```

Edit `.env` file (same DATABASE_URL):

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?schema=public
```

---

## 🖥️ Alternative: Local PostgreSQL

If you prefer local development:

### **Step 1: Install PostgreSQL**

**Windows:**

1. Download: https://www.postgresql.org/download/windows/
2. Run installer
3. Remember the password you set for `postgres` user
4. Default port: 5432

**Mac:**

```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu):**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### **Step 2: Create Database**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE fitness_dance_dev;

# Exit
\q
```

### **Step 3: Add to .env File**

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/fitness_dance_dev?schema=public
```

---

## ✅ After Database Setup

### **1. Test Connection**

Create test file: `fitness-dance-backend/test-db-connection.ts`

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

### **2. Create Migration**

```bash
cd fitness-dance-backend
npx prisma migrate dev --name init
```

This creates all 26 tables!

### **3. Open Prisma Studio (Optional)**

View your database in a GUI:

```bash
npx prisma studio
```

Opens at: http://localhost:5555

---

## 🎯 Quick Decision Guide

**Choose Supabase if:**

- ✅ You want quick setup (5 minutes)
- ✅ You want free hosting
- ✅ You want web dashboard
- ✅ You're okay with cloud database

**Choose Local PostgreSQL if:**

- ✅ You want offline development
- ✅ You want maximum speed
- ✅ You're comfortable installing software
- ✅ You want full control

---

## 📋 Setup Checklist

### **Supabase Setup:**

- [ ] Create Supabase account
- [ ] Create new project
- [ ] Get connection string
- [ ] Add DATABASE_URL to root `.env`
- [ ] Add DATABASE_URL to member-api `.env`
- [ ] Add DATABASE_URL to admin-api `.env`
- [ ] Test connection
- [ ] Create migration

### **Local PostgreSQL Setup:**

- [ ] Install PostgreSQL
- [ ] Create database
- [ ] Add DATABASE_URL to all `.env` files
- [ ] Test connection
- [ ] Create migration

---

## 🆘 Troubleshooting

### **Error: "Connection refused"**

**Solution:**

- Check if PostgreSQL is running
- Check if port 5432 is correct
- Check if password is correct
- Check if database name exists

### **Error: "Password authentication failed"**

**Solution:**

- Double-check password in connection string
- Make sure password doesn't have special characters that need encoding
- Try resetting password in Supabase dashboard

### **Error: "Database does not exist"**

**Solution:**

- Create database first
- Check database name in connection string

---

## 🚀 Next Steps After Database Setup

1. ✅ Test connection
2. ✅ Create migration (`npx prisma migrate dev --name init`)
3. ✅ Seed initial data
4. ✅ Start building features!

---

**Which option would you like to use?**

- A) Supabase (Recommended - 5 minutes)
- B) Local PostgreSQL
- C) Railway
- D) Need more help deciding

I can guide you through any of these options!
