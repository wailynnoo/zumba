# Railway Quick Start Guide 🚂

**Fastest way to deploy admin-api on Railway**

---

## ⚡ Quick Setup (5 Minutes)

### **1. Create Railway Project**

1. Go to https://railway.app
2. Sign up / Login
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository

### **2. Add Database**

1. In project, click "New" → "Database" → "Add PostgreSQL"
2. Wait 1-2 minutes
3. Database is ready! Railway auto-creates `DATABASE_URL`

### **3. Deploy Admin API**

1. Click "New" → "GitHub Repo" (or "Empty Project")
2. **Root Directory:** `admin-api`
3. Railway auto-detects Node.js

### **4. Configure Build**

**Build Command:**

```bash
npm install && npm run build && cd .. && npx prisma generate
```

**Start Command:**

```bash
npm start
```

### **5. Set Environment Variables**

In Railway dashboard → API service → Variables:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-32-char-secret-here
JWT_REFRESH_SECRET=your-32-char-secret-here
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.com
```

### **6. Run Migrations**

In Railway dashboard → API service → Deployments → Run Command:

```bash
npx prisma migrate deploy
```

### **7. Test**

```bash
curl https://your-app.railway.app/health
```

---

## 🎯 That's It!

Your API is live on Railway! 🚀

---

## 📝 Important Notes

1. **Prisma Schema:** In parent directory, so build command includes `cd .. && npx prisma generate`

2. **Database URL:** Railway auto-injects if database is in same project

3. **Port:** Railway sets `PORT` automatically, don't hardcode

4. **JWT Secrets:** Generate strong secrets (32+ characters)

---

## 🔗 Next Steps

- Configure custom domain
- Set up monitoring
- Add seed data
- Test all endpoints

---

**Need help?** Check `RAILWAY_DEPLOYMENT_GUIDE.md` for detailed instructions.
