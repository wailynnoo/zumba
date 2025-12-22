# React Native 0.82 - Manual Setup Guide

**If automated setup fails due to permissions, use this manual approach.**

---

## 🚀 **Step 1: Fix npm Permissions (Do This First!)**

Run these commands in your terminal:

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ~/.nvm
sudo chown -R $(whoami) /Users/mac/.nvm/versions/node/v20.18.1/lib/node_modules/npm

# Verify
ls -la ~/.npm
```

---

## 📦 **Step 2: Use Correct Command**

After fixing permissions:

```bash
# Switch to Node 20.18.1
nvm use 20.18.1

# Navigate to project directory
cd /Users/mac/Documents/Zumba/zumba

# Use the community CLI (recommended)
npx @react-native-community/cli@latest init ZFitDanceMobile --version 0.82.0
```

---

## 🔄 **Alternative: Manual Project Creation**

If automated setup still fails, create project manually:

### **Step 1: Create Project Directory**

```bash
cd /Users/mac/Documents/Zumba/zumba
mkdir ZFitDanceMobile
cd ZFitDanceMobile
```

### **Step 2: Initialize npm**

```bash
npm init -y
```

### **Step 3: Install React Native 0.82**

```bash
npm install react-native@0.82.0 react@19.1.1
```

### **Step 4: Use React Native Template**

```bash
# Download template
npx react-native@0.82.0 init ZFitDanceMobile --skip-install

# Or clone template manually
git clone https://github.com/facebook/react-native.git --branch v0.82.0 --depth 1 temp-rn
cp -r temp-rn/packages/react-native/template/* .
rm -rf temp-rn
```

---

## ✅ **Recommended: Fix Permissions First**

**Run this in your terminal:**

```bash
# 1. Fix permissions
sudo chown -R $(whoami) ~/.npm ~/.nvm

# 2. Switch Node version
nvm use 20.18.1

# 3. Create project
cd /Users/mac/Documents/Zumba/zumba
npx @react-native-community/cli@latest init ZFitDanceMobile --version 0.82.0
```

---

**Try fixing permissions first, then run the setup command!**

