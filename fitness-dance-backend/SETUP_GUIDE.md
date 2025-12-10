# Setup Guide - Fitness Dance Backend

**Current Status:** ✅ Folder structure created

---

## ✅ What's Done

1. ✅ Created `fitness-dance-backend/` folder
2. ✅ Moved `prisma/` folder to root
3. ✅ Created `member-api/` folder
4. ✅ Created `admin-api/` folder
5. ✅ Created `.env.example` files
6. ✅ Created `.gitignore`
7. ✅ Created `README.md`

---

## 📁 Current Structure

```
fitness-dance-backend/
├── prisma/
│   └── schema.prisma          ✅ (Already moved)
├── member-api/                ✅ (Created)
├── admin-api/                 ✅ (Created)
├── .env.example               ✅ (Created)
├── .gitignore                 ✅ (Created)
└── README.md                  ✅ (Created)
```

---

## 🚀 Next Steps

### **Step 1: Fix Prisma Schema (If Needed)**

If you're using Prisma 7, you may need to update the schema format. The current schema uses the standard format which works for Prisma 5-6.

**To check your Prisma version:**

```bash
npx prisma --version
```

**If you get an error about datasource URL:**

- For Prisma 5-6: Current format is correct ✅
- For Prisma 7: May need different format (check Prisma 7 docs)

**For now, try:**

```bash
cd fitness-dance-backend
npx prisma format
```

If it works, you're good! If not, we'll fix it.

---

### **Step 2: Set Up Environment Variables**

**Root `.env`:**

```bash
cd fitness-dance-backend
copy .env.example .env
# Edit .env and add your DATABASE_URL
```

**Member API `.env`:**

```bash
cd member-api
copy .env.example .env
# Edit .env with your configuration
```

**Admin API `.env`:**

```bash
cd admin-api
copy .env.example .env
# Edit .env with your configuration
```

---

### **Step 3: Install Prisma (Root Level)**

```bash
cd fitness-dance-backend
npm init -y
npm install -D prisma
npm install @prisma/client
```

---

### **Step 4: Test Prisma Schema**

```bash
# From fitness-dance-backend/
npx prisma format
npx prisma generate
```

If these commands work, your schema is valid! ✅

---

### **Step 5: Initialize API Projects**

**Member API:**

```bash
cd member-api
npm init -y
# Install dependencies (see Next Steps)
```

**Admin API:**

```bash
cd admin-api
npm init -y
# Install dependencies (see Next Steps)
```

---

## 📋 Environment Variables Checklist

### **Root `.env`** (Required)

- [ ] `DATABASE_URL` - PostgreSQL connection string

### **Member API `.env`** (Required)

- [ ] `DATABASE_URL` - Same as root
- [ ] `PORT` - 3001
- [ ] `JWT_SECRET` - Secret key for JWT
- [ ] `JWT_REFRESH_SECRET` - Secret for refresh tokens
- [ ] Other services (Cloudflare, Supabase, SendGrid, etc.)

### **Admin API `.env`** (Required)

- [ ] `DATABASE_URL` - Same as root
- [ ] `PORT` - 3002
- [ ] `JWT_SECRET` - Different from Member API
- [ ] `JWT_REFRESH_SECRET` - Different from Member API
- [ ] Other services (Cloudflare, Supabase, SendGrid, etc.)

---

## 🔧 Prisma Commands Reference

All Prisma commands run from `fitness-dance-backend/`:

```bash
# Format schema
npx prisma format

# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# Apply migrations
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

---

## ⚠️ Important Notes

1. **Prisma Schema Location:** `prisma/schema.prisma` at root level
2. **Database URL:** Same for both APIs (shared database)
3. **JWT Secrets:** Must be different for Member API and Admin API
4. **Ports:** Member API (3001), Admin API (3002)
5. **Environment Files:** Never commit `.env` files (use `.env.example`)

---

## 🎯 Ready for Next Step?

Once you've:

1. ✅ Fixed Prisma schema (if needed)
2. ✅ Created `.env` files
3. ✅ Installed Prisma
4. ✅ Tested `npx prisma generate`

**Next:** Set up Member API project structure!

---

**Questions?** Check the main `README.md` or `Project_Folder_Structure.md` in the parent directory.
