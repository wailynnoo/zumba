# Fitness Dance App - Backend

**Project:** Fitness Dance App  
**Domain:** zfitdance.com  
**Structure:** Monorepo with Shared Database

---

## 📁 Project Structure

```
fitness-dance-backend/
├── prisma/                    # Shared Prisma schema
│   └── schema.prisma
├── member-api/                # Member API (Port 3001)
├── admin-api/                 # Admin API (Port 3002)
├── .env                       # Root .env (for Prisma)
└── .env.example               # Example env file
```

---

## 🚀 Quick Start

### **1. Set Up Environment Variables**

**Root `.env` (for Prisma migrations):**

```bash
# Copy example file
cp .env.example .env

# Edit .env and add your DATABASE_URL
DATABASE_URL="postgresql://user:password@localhost:5432/fitness_dance_dev?schema=public"
```

**Member API `.env`:**

```bash
cd member-api
cp .env.example .env
# Edit .env with your configuration
```

**Admin API `.env`:**

```bash
cd admin-api
cp .env.example .env
# Edit .env with your configuration
```

### **2. Install Prisma (Root Level)**

```bash
# From fitness-dance-backend/
npm init -y
npm install -D prisma
npm install @prisma/client

# Generate Prisma Client
npx prisma generate
```

### **3. Run Database Migrations**

```bash
# From fitness-dance-backend/
npx prisma migrate dev --name init
```

### **4. Seed Initial Data**

```bash
# From fitness-dance-backend/
npx prisma db seed
```

---

## 📝 Next Steps

1. ✅ Folder structure created
2. ✅ Prisma schema in place
3. ⏭️ Set up Member API project
4. ⏭️ Set up Admin API project
5. ⏭️ Configure environment variables
6. ⏭️ Run initial migration

---

## 🔧 Prisma Commands

All Prisma commands should be run from the root directory:

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio

# Reset database (development only)
npx prisma migrate reset
```

---

## 📚 Documentation

- **Database Schema:** See `prisma/schema.prisma`
- **Folder Structure:** See `../Project_Folder_Structure.md`
- **Development Roadmap:** See `../Development_Roadmap.md`

---

**Ready to set up the API projects!**
