# Admin Web Portal

**Fitness Dance App - Admin Dashboard**

Admin web portal for managing the Fitness Dance App.

---

## 🚀 Quick Start

### **Install Dependencies**

```bash
npm install
```

### **Environment Setup**

1. Copy `.env.local.example` to `.env.local`:

   ```bash
   copy .env.local.example .env.local
   ```

2. Update `NEXT_PUBLIC_API_URL` with your admin-api URL:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3002
   ```

### **Run Development Server**

```bash
npm run dev
```

Server will run on `http://localhost:3000`

---

## 📁 Project Structure

```
admin-web/
├── app/
│   ├── (auth)/
│   │   └── login/          # Login page
│   ├── (dashboard)/
│   │   ├── page.tsx        # Dashboard home
│   │   ├── categories/     # Categories management
│   │   └── layout.tsx     # Dashboard layout
│   └── layout.tsx          # Root layout
├── lib/
│   ├── api.ts             # API client
│   ├── auth.ts            # Auth utilities
│   └── utils.ts           # Utility functions
├── components/            # React components
└── hooks/                 # Custom React hooks
```

---

## 🚂 Railway Deployment

### **Step 1: Create Railway Service**

1. Railway Dashboard → Your project
2. Click **"New"** → **"Empty Service"**
3. Name it: `admin-web`

### **Step 2: Configure Build & Start Commands**

**Build Command:**

```
cd admin-web && npm install && npm run build
```

**Start Command:**

```
cd admin-web && npm start
```

### **Step 3: Set Environment Variables**

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-admin-api-url.up.railway.app
PORT=3000
```

---

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

---

## 📝 Features

- ✅ Admin login
- ✅ Dashboard overview
- ✅ Categories management
- ✅ JWT authentication
- ✅ API integration with admin-api

---

**Ready for development!** 🎉
