# Admin Web Portal - Folder Structure & Railway Deployment 🎨

**Recommended structure for admin web portal that can be deployed to Railway**

---

## 📁 Recommended Folder Structure

### **Option 1: Add to Existing Monorepo (Recommended)**

```
fitness-dance-backend/              # Root (current structure)
├── admin-api/                      # ✅ Admin API (already exists)
├── member-api/                     # ✅ Member API (already exists)
├── admin-web/                      # 🆕 Admin Web Portal (NEW)
│   ├── src/
│   │   ├── app/                    # Next.js app directory
│   │   │   ├── (auth)/
│   │   │   │   └── login/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── page.tsx       # Dashboard
│   │   │   │   ├── videos/
│   │   │   │   ├── users/
│   │   │   │   ├── categories/
│   │   │   │   └── settings/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── dashboard/
│   │   │   ├── tables/
│   │   │   └── forms/
│   │   ├── lib/
│   │   │   ├── api.ts              # API client
│   │   │   ├── auth.ts             # Auth utilities
│   │   │   └── utils.ts
│   │   └── hooks/
│   ├── public/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
├── prisma/                         # ✅ Shared Prisma schema
└── package.json                    # Root package.json
```

**Pros:**

- ✅ Everything in one place
- ✅ Easy to share types/interfaces
- ✅ Single repository
- ✅ Can deploy all services together

---

## 🎯 Tech Stack Recommendation

### **Next.js 14+ (App Router) - Recommended**

**Why Next.js?**

- ✅ Can be deployed to Railway
- ✅ Server-side rendering (SSR) or Static Export
- ✅ Great for admin panels
- ✅ Easy API integration
- ✅ Modern and fast

**Dependencies:**

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0",
    "zod": "^3.22.0",
    "react-hook-form": "^7.48.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 🚀 Railway Deployment Options

### **Option 1: Next.js with Static Export (Easiest)**

**Best for:** Simple admin panel, no server-side features needed

**Setup:**

1. Configure Next.js for static export
2. Build generates static files
3. Railway serves static files via Nginx

**next.config.js:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

module.exports = nextConfig;
```

**Railway Build Command:**

```
cd admin-web && npm install && npm run build
```

**Railway Start Command:**

```
npx serve -s out -p $PORT
```

**Or use Railway's static file serving (if available)**

---

### **Option 2: Next.js Standalone (Full SSR)**

**Best for:** Server-side rendering, API routes, dynamic features

**next.config.js:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
};

module.exports = nextConfig;
```

**Railway Build Command:**

```
cd admin-web && npm install && npm run build
```

**Railway Start Command:**

```
cd admin-web && npm start
```

**package.json scripts:**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

---

## 📋 Step-by-Step Setup

### **Step 1: Create admin-web Folder**

```bash
cd D:\Zumba\fitness-dance-backend
mkdir admin-web
cd admin-web
```

### **Step 2: Initialize Next.js Project**

```bash
# Using Next.js CLI
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# Or manually create structure
```

### **Step 3: Install Dependencies**

```bash
cd admin-web
npm install axios @tanstack/react-query zod react-hook-form
npm install -D @types/node @types/react typescript tailwindcss
```

### **Step 4: Configure for Railway**

**Create `admin-web/next.config.js`:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // For Railway deployment
  output: "standalone", // or 'export' for static
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002",
  },
};

module.exports = nextConfig;
```

**Create `admin-web/package.json`:**

```json
{
  "name": "admin-web",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

---

## 🚂 Railway Deployment Setup

### **Step 1: Create Railway Service**

1. Railway Dashboard → Your project
2. Click **"New"** → **"Empty Service"**
3. Name it: `admin-web`

### **Step 2: Configure Build & Start Commands**

**For Static Export:**

- **Build Command:** `cd admin-web && npm install && npm run build`
- **Start Command:** `npx serve -s admin-web/out -p $PORT`

**For Standalone (SSR):**

- **Build Command:** `cd admin-web && npm install && npm run build`
- **Start Command:** `cd admin-web && npm start`

### **Step 3: Set Environment Variables**

**In Railway Dashboard → admin-web → Variables:**

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-admin-api-url.up.railway.app
PORT=3000
```

**Important:** Use your actual `admin-api` Railway URL!

---

## 📁 Complete Folder Structure Example

```
fitness-dance-backend/
├── admin-api/                      # Backend API
│   ├── src/
│   ├── package.json
│   └── ...
├── member-api/                     # Member API
│   ├── src/
│   ├── package.json
│   └── ...
├── admin-web/                      # Admin Web Portal
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   └── login/
│   │   │   │       └── page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx        # Dashboard home
│   │   │   │   ├── videos/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── users/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── categories/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn/ui
│   │   │   ├── dashboard/
│   │   │   └── forms/
│   │   ├── lib/
│   │   │   ├── api.ts              # API client
│   │   │   └── utils.ts
│   │   └── hooks/
│   ├── public/
│   ├── .env.local
│   ├── next.config.js
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── prisma/                         # Shared database
│   ├── schema.prisma
│   └── migrations/
└── package.json                    # Root
```

---

## 🔧 API Client Setup

**Create `admin-web/src/lib/api.ts`:**

```typescript
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## ✅ Quick Start Checklist

- [ ] Create `admin-web` folder in root
- [ ] Initialize Next.js project
- [ ] Install dependencies
- [ ] Configure `next.config.js` for Railway
- [ ] Set up API client
- [ ] Create basic login page
- [ ] Create dashboard layout
- [ ] Set up Railway service
- [ ] Configure build/start commands
- [ ] Set environment variables
- [ ] Deploy to Railway

---

## 🎯 Recommended: Start with Static Export

**For first deployment, use static export:**

- Easier to deploy
- No server-side complexity
- Faster builds
- Can upgrade to SSR later if needed

**Then upgrade to standalone if you need:**

- Server-side rendering
- API routes
- Dynamic features

---

**Ready to create the admin web portal! Start with the folder structure above.** 🚀
