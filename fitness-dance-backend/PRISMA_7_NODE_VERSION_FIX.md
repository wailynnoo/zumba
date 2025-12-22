# Fix Prisma 7 Node.js Version Issue

**Error:** `ERR_REQUIRE_ESM` when running `npx prisma generate`  
**Cause:** Prisma 7.2.0 requires Node.js 20.19.4+, but you're using 20.11.1

---

## 🚀 Solution: Upgrade Node.js

### **Step 1: Install Node.js 20.19.4+**

```bash
# Install Node 20.19.4 (or latest 20.x)
nvm install 20.19.4

# Or install latest LTS
nvm install lts/iron

# Use it
nvm use 20.19.4

# Set as default (optional)
nvm alias default 20.19.4

# Verify
node --version
# Should show: v20.19.4 or higher
```

### **Step 2: Regenerate Prisma Client**

```bash
cd /Users/mac/Documents/Zumba/zumba/fitness-dance-backend

# Generate Prisma client
npx prisma generate

# Build admin-api
cd admin-api
npm run build
```

---

## 🔧 Alternative: Use Node 20.18.1 (If Already Installed)

If you already have Node 20.18.1 installed:

```bash
# Switch to 20.18.1
nvm use 20.18.1

# Try generating (might work, but 20.19.4+ is recommended)
cd /Users/mac/Documents/Zumba/zumba/fitness-dance-backend
npx prisma generate
```

**Note:** Prisma 7.2.0 officially requires 20.19.4+, but 20.18.1 might work for generation. For production, use 20.19.4+.

---

## ✅ After Upgrading Node

1. **Generate Prisma Client:**
   ```bash
   cd fitness-dance-backend
   npx prisma generate
   ```

2. **Build Admin API:**
   ```bash
   cd admin-api
   npm run build
   ```

3. **Build Member API:**
   ```bash
   cd member-api
   npm run build
   ```

---

## 📝 Summary

- **Current Node:** v20.11.1 ❌
- **Required Node:** v20.19.4+ ✅
- **Action:** Upgrade Node.js using `nvm install 20.19.4`

---

**Upgrade Node.js first, then try building again!**

