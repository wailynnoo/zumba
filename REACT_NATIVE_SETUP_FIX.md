# React Native 0.82 Setup - Node Version Fix

**Issue:** Node version mismatch and npm permissions

---

## 🔧 **Solution 1: Update Node Version (Recommended)**

### **Option A: Install Node 20.19.4+ (Best)**

```bash
# Install latest LTS Node (20.19.4+)
nvm install 20.19.4
# or
nvm install lts/iron

# Use it
nvm use 20.19.4
# or set as default
nvm alias default 20.19.4

# Verify
node --version
# Should show: v20.19.4 or higher
```

### **Option B: Use Node 20.18.1 (Should Work)**

The warning about Node 20.19.4 is usually just a recommendation. Node 20.18.1 should work fine:

```bash
# Switch to 20.18.1 (you already have this)
nvm use 20.18.1

# Verify
node --version
# Should show: v20.18.1
```

---

## 🚀 **Solution 2: Create Project with Correct Command**

### **Use the Community CLI (Recommended):**

```bash
# Make sure you're using Node 20.18.1 or higher
nvm use 20.18.1

# Navigate to your project directory
cd /Users/mac/Documents/Zumba/zumba

# Create project using community CLI
npx @react-native-community/cli@latest init ZFitDanceMobile --version 0.82.0
```

### **Alternative: Use React Native CLI directly:**

```bash
# If community CLI doesn't work, try:
npx react-native@0.82.0 init ZFitDanceMobile
```

### **If both fail, try with --skip-install:**

```bash
# Create project without installing dependencies
npx @react-native-community/cli@latest init ZFitDanceMobile --version 0.82.0 --skip-install

# Then manually install
cd ZFitDanceMobile
npm install
```

---

## 🔒 **Solution 3: Fix npm Permissions (CRITICAL - Do This First!)**

You're getting `EPERM` errors. Fix this first:

```bash
# Fix npm and nvm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ~/.nvm
sudo chown -R $(whoami) /Users/mac/.nvm/versions/node/v20.18.1/lib/node_modules/npm

# Verify permissions
ls -la ~/.npm
ls -la ~/.nvm

# If still issues, reinstall npm
npm install -g npm@latest --force
```

**After fixing permissions, try again:**
```bash
nvm use 20.18.1
cd /Users/mac/Documents/Zumba/zumba
npx @react-native-community/cli@latest init ZFitDanceMobile --version 0.82.0
```

---

## ✅ **Recommended Steps (In Order)**

1. **Update Node to 20.19.4+ (if possible):**
   ```bash
   nvm install 20.19.4
   nvm use 20.19.4
   ```

2. **Or use 20.18.1 (should work):**
   ```bash
   nvm use 20.18.1
   ```

3. **Create project:**
   ```bash
   cd /Users/mac/Documents/Zumba/zumba
   npx @react-native-community/cli@latest init ZFitDanceMobile --version 0.82.0
   ```

4. **If that fails, try:**
   ```bash
   npx react-native@0.82.0 init ZFitDanceMobile
   ```

5. **Verify project created:**
   ```bash
   cd ZFitDanceMobile
   cat package.json | grep "react-native"
   # Should show: "react-native": "0.82.0"
   ```

---

## 📝 **Note About Node Version Warning**

The warning `required: { node: '>= 20.19.4' }` is usually just a recommendation. React Native 0.82 should work with Node 20.18.1, but for best compatibility:

- ✅ **Node 20.19.4+** - Recommended (no warnings)
- ✅ **Node 20.18.1** - Should work (minor warnings, usually safe)
- ⚠️ **Node 20.11.1** - May have issues (your current system version)

---

## 🎯 **Quick Fix Command**

Run this in your terminal:

```bash
# Switch to Node 20.18.1
nvm use 20.18.1

# Create project
cd /Users/mac/Documents/Zumba/zumba
npx @react-native-community/cli@latest init ZFitDanceMobile --version 0.82.0
```

---

**Try these steps and let me know if you encounter any issues!**

