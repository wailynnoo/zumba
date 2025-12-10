# PostgreSQL UI Tools for Local Development

**Your Setup:** PostgreSQL installed at `D:\PostgreSQL\16`

---

## ✅ Option 1: Prisma Studio (Already Available!) ⭐ Recommended

**Prisma Studio** is built into Prisma and provides a beautiful web-based UI for your database.

### **How to Use:**

```bash
cd fitness-dance-backend
npx prisma studio
```

**Opens at:** http://localhost:5555

### **Features:**

- ✅ **No installation needed** - Already part of Prisma
- ✅ **Beautiful modern UI** - Clean, intuitive interface
- ✅ **View all tables** - Browse your database structure
- ✅ **Edit data** - Add, edit, delete records
- ✅ **Filter & search** - Find data quickly
- ✅ **Relationships** - Navigate between related tables
- ✅ **Works with your schema** - Automatically uses your Prisma schema

### **Screenshot Preview:**

- Browse tables in sidebar
- View table data in main area
- Edit records inline
- See relationships between tables

---

## 🆓 Option 2: pgAdmin (Free, Full-Featured)

**pgAdmin** is the official PostgreSQL administration tool.

### **Installation:**

**Windows:**

1. Download from: https://www.pgadmin.org/download/
2. Run installer
3. Launch pgAdmin

### **Setup Connection:**

1. Open pgAdmin
2. Right-click "Servers" → "Create" → "Server"
3. **General Tab:**
   - Name: `Local PostgreSQL`
4. **Connection Tab:**
   - Host: `localhost`
   - Port: `5432`
   - Database: `fitness_dance_dev`
   - Username: `postgres`
   - Password: Your PostgreSQL password
5. Click "Save"

### **Features:**

- ✅ Full PostgreSQL administration
- ✅ Query editor with syntax highlighting
- ✅ Database backup/restore
- ✅ User management
- ✅ Performance monitoring
- ✅ More advanced features

---

## 🆓 Option 3: DBeaver (Free, Cross-Database)

**DBeaver** is a universal database tool that works with PostgreSQL and many other databases.

### **Installation:**

**Windows:**

1. Download from: https://dbeaver.io/download/
2. Run installer
3. Launch DBeaver

### **Setup Connection:**

1. Open DBeaver
2. Click "New Database Connection"
3. Select "PostgreSQL"
4. **Connection Settings:**
   - Host: `localhost`
   - Port: `5432`
   - Database: `fitness_dance_dev`
   - Username: `postgres`
   - Password: Your PostgreSQL password
5. Click "Test Connection"
6. Click "Finish"

### **Features:**

- ✅ Works with multiple database types
- ✅ Powerful query editor
- ✅ ER diagrams
- ✅ Data export/import
- ✅ SQL formatter
- ✅ Free and open source

---

## 💰 Option 4: TablePlus (Free Tier Available)

**TablePlus** is a modern, native database management tool.

### **Installation:**

**Windows:**

1. Download from: https://tableplus.com/
2. Run installer
3. Launch TablePlus

### **Setup Connection:**

1. Open TablePlus
2. Click "Create a new connection"
3. Select "PostgreSQL"
4. **Connection Details:**
   - Name: `Local PostgreSQL`
   - Host: `localhost`
   - Port: `5432`
   - User: `postgres`
   - Password: Your PostgreSQL password
   - Database: `fitness_dance_dev`
5. Click "Test" then "Connect"

### **Features:**

- ✅ Beautiful, modern UI
- ✅ Fast and lightweight
- ✅ Multiple tabs
- ✅ Query history
- ✅ Free tier available (limited connections)
- ✅ Paid version: $89 one-time

---

## 🚀 Quick Start: Use Prisma Studio Now!

**Since you already have Prisma, this is the fastest option:**

```bash
# Navigate to your project
cd fitness-dance-backend

# Start Prisma Studio
npx prisma studio
```

**Then open:** http://localhost:5555 in your browser

You'll see:

- All your tables in the sidebar
- Click any table to view/edit data
- Add new records
- Edit existing records
- Delete records
- Navigate relationships

---

## 📊 Comparison

| Feature          | Prisma Studio        | pgAdmin            | DBeaver            | TablePlus          |
| ---------------- | -------------------- | ------------------ | ------------------ | ------------------ |
| **Installation** | ✅ Already installed | ❌ Need to install | ❌ Need to install | ❌ Need to install |
| **Setup Time**   | ⚡ Instant           | 🕐 5 minutes       | 🕐 5 minutes       | 🕐 5 minutes       |
| **Ease of Use**  | ⭐⭐⭐⭐⭐           | ⭐⭐⭐             | ⭐⭐⭐⭐           | ⭐⭐⭐⭐⭐         |
| **Query Editor** | ❌ No                | ✅ Yes             | ✅ Yes             | ✅ Yes             |
| **Free**         | ✅ Yes               | ✅ Yes             | ✅ Yes             | ⚠️ Limited free    |
| **Best For**     | Quick data viewing   | Advanced admin     | Multiple DBs       | Modern UI          |

---

## 🎯 My Recommendation

**For Quick Data Viewing:**

- ✅ **Use Prisma Studio** - Already available, no setup needed

**For Advanced Database Management:**

- ✅ **Install DBeaver** - Free, powerful, works with multiple databases

**For Beautiful Modern UI:**

- ✅ **Try TablePlus** - If you want the best-looking interface

---

## 🚀 Try Prisma Studio Right Now!

```bash
cd fitness-dance-backend
npx prisma studio
```

Open http://localhost:5555 and start exploring your database!

---

**Which one would you like to use?**
