# Admin API - Deployment Checklist ✅

**Quick checklist before uploading to hosting**

---

## ✅ Pre-Upload Checklist

### **Code Quality**

- [x] All TypeScript compiles without errors
- [x] All dependencies in `package.json`
- [x] `.gitignore` configured correctly
- [x] No hardcoded secrets or credentials
- [x] Build process tested locally

### **Files Ready**

- [x] `.env.example` created
- [x] `package.json` has correct scripts
- [x] `tsconfig.json` configured
- [x] Source code complete
- [x] Documentation updated

### **Environment Variables**

- [ ] `DATABASE_URL` - Database connection string
- [ ] `JWT_SECRET` - Strong secret (32+ chars)
- [ ] `JWT_REFRESH_SECRET` - Strong secret (32+ chars)
- [ ] `JWT_EXPIRES_IN` - Token expiration (default: 30m)
- [ ] `JWT_REFRESH_EXPIRES_IN` - Refresh expiration (default: 7d)
- [ ] `PORT` - Server port (default: 3002)
- [ ] `NODE_ENV` - Set to "production"
- [ ] `CORS_ORIGIN` - Your frontend domain (not `*`)

### **Database**

- [ ] Database created and accessible
- [ ] Database migrations ready
- [ ] Seed data ready (if needed)
- [ ] Connection string tested

### **Security**

- [ ] Strong JWT secrets generated
- [ ] CORS origin set to specific domain
- [ ] No default passwords
- [ ] Environment variables secured

---

## 🚀 Upload Checklist

### **Files to Upload**

- [ ] `src/` directory (source code)
- [ ] `package.json`
- [ ] `package-lock.json`
- [ ] `tsconfig.json`
- [ ] `.env.example` (for reference)
- [ ] `prisma/` directory (from parent folder)
- [ ] `prisma.config.ts` (from parent folder)

### **Files NOT to Upload**

- [ ] `node_modules/` (install on server)
- [ ] `dist/` (build on server)
- [ ] `.env` (set in hosting dashboard)
- [ ] `.git/` (if using Git deployment)

---

## 🔧 Server Setup Checklist

### **On Hosting Server**

- [ ] Node.js installed (v18+ recommended)
- [ ] npm installed
- [ ] Navigate to project directory
- [ ] Run `npm install --production`
- [ ] Run `npm run build`
- [ ] Generate Prisma Client: `cd .. && npx prisma generate`
- [ ] Run migrations: `cd .. && npx prisma migrate deploy`
- [ ] Set environment variables
- [ ] Start server: `npm start`

---

## ✅ Post-Deployment Verification

### **Health Check**

- [ ] `GET /health` returns 200 OK
- [ ] Response includes timestamp

### **Authentication**

- [ ] `POST /api/auth/login` works
- [ ] Returns access token and refresh token
- [ ] Token can be used for authenticated requests

### **Category Endpoints**

- [ ] `GET /api/categories` requires authentication
- [ ] `POST /api/categories` creates category
- [ ] `GET /api/categories/:id` returns category
- [ ] `PUT /api/categories/:id` updates category
- [ ] `DELETE /api/categories/:id` soft deletes

### **Error Handling**

- [ ] 404 errors return proper JSON
- [ ] 500 errors don't expose sensitive info
- [ ] Validation errors return proper format

---

## 🔍 Monitoring Setup

- [ ] Error logging configured
- [ ] Uptime monitoring set up
- [ ] Database connection monitoring
- [ ] API response time monitoring
- [ ] Alert system configured

---

## 📝 Notes

**Prisma Schema Location:**

- Prisma schema is in `fitness-dance-backend/prisma/`, not in `admin-api/`
- When generating Prisma Client, run from parent directory
- When running migrations, run from parent directory

**Environment Variables:**

- Set in hosting dashboard (recommended)
- Or create `.env` file on server
- Never commit `.env` to Git

**Build Process:**

1. `npm install` - Install dependencies
2. `npm run build` - Build TypeScript
3. `cd .. && npx prisma generate` - Generate Prisma Client
4. `cd .. && npx prisma migrate deploy` - Run migrations
5. `cd admin-api && npm start` - Start server

---

**Status:** Ready for deployment! ✅
