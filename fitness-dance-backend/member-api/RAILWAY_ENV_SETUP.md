# Railway Environment Variables Setup

**Error:** `JWT_ACCESS_SECRET` is missing in Railway  
**Solution:** Add all required environment variables in Railway dashboard

---

## 🚀 Required Environment Variables

### **1. Database**
```
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
```
- **Required:** ✅ Yes
- **Description:** PostgreSQL connection string
- **Railway:** Usually auto-provided if you have a PostgreSQL service

---

### **2. JWT Secrets (REQUIRED)**

#### **JWT_ACCESS_SECRET**
```
JWT_ACCESS_SECRET=your-secret-key-at-least-32-characters-long
```
- **Required:** ✅ Yes
- **Min Length:** 32 characters
- **Description:** Secret key for signing access tokens
- **Generate:** Use a secure random string generator

#### **JWT_REFRESH_SECRET**
```
JWT_REFRESH_SECRET=your-refresh-secret-key-at-least-32-characters
```
- **Required:** ✅ Yes
- **Min Length:** 32 characters
- **Description:** Secret key for signing refresh tokens
- **Generate:** Use a different secure random string than access secret

#### **JWT_ACCESS_EXPIRY** (Optional)
```
JWT_ACCESS_EXPIRY=30m
```
- **Required:** ❌ No (default: "30m")
- **Format:** `30m`, `1h`, `7d`, etc.
- **Description:** Access token expiration time

#### **JWT_REFRESH_EXPIRY** (Optional)
```
JWT_REFRESH_EXPIRY=7d
```
- **Required:** ❌ No (default: "7d")
- **Format:** `30m`, `1h`, `7d`, etc.
- **Description:** Refresh token expiration time

---

### **3. Server Configuration (Optional)**

#### **NODE_ENV**
```
NODE_ENV=production
```
- **Required:** ❌ No (default: "development")
- **Values:** `development`, `production`, `test`

#### **PORT**
```
PORT=3001
```
- **Required:** ❌ No (default: 3001)
- **Description:** Server port (Railway usually sets this automatically)

#### **CORS_ORIGIN**
```
CORS_ORIGIN=https://www.z-fitdanceplus.com,https://z-fitdanceplus.com
```
- **Required:** ❌ No (default: "http://localhost:3000,http://localhost:3001")
- **Description:** Comma-separated list of allowed origins
- **Railway:** Set to your production domain(s)

#### **TRUST_PROXY**
```
TRUST_PROXY=true
```
- **Required:** ❌ No (default: true in production)
- **Description:** Trust proxy headers (needed for Railway)

---

### **4. Cloudflare R2 (Optional - for video streaming)**

```
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=fitness-dance-videos
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
```

- **Required:** ❌ No (only needed if using video streaming)
- **Description:** Cloudflare R2 storage credentials

---

## 📝 How to Add Variables in Railway

### **Method 1: Railway Dashboard**

1. Go to your Railway project: https://railway.com
2. Select your **member-api** service
3. Click on **Variables** tab
4. Click **+ New Variable**
5. Add each variable:
   - **Name:** `JWT_ACCESS_SECRET`
   - **Value:** `your-secret-key-at-least-32-characters-long`
6. Click **Add**
7. Repeat for all required variables

### **Method 2: Railway CLI**

```bash
# Set JWT secrets
railway variables set JWT_ACCESS_SECRET="your-secret-key-at-least-32-characters-long"
railway variables set JWT_REFRESH_SECRET="your-refresh-secret-key-at-least-32-characters"

# Set CORS origin
railway variables set CORS_ORIGIN="https://www.z-fitdanceplus.com,https://z-fitdanceplus.com"

# Set trust proxy
railway variables set TRUST_PROXY="true"

# Set NODE_ENV
railway variables set NODE_ENV="production"
```

---

## 🔐 Generate Secure JWT Secrets

### **Option 1: Using Node.js**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **Option 2: Using OpenSSL**

```bash
openssl rand -hex 32
```

### **Option 3: Online Generator**

Use a secure random string generator (at least 32 characters)

---

## ✅ Quick Setup Checklist

- [ ] `DATABASE_URL` - Set (usually auto-provided by Railway PostgreSQL)
- [ ] `JWT_ACCESS_SECRET` - Generate and set (min 32 chars)
- [ ] `JWT_REFRESH_SECRET` - Generate and set (min 32 chars, different from access)
- [ ] `JWT_ACCESS_EXPIRY` - Set to `30m` (optional)
- [ ] `JWT_REFRESH_EXPIRY` - Set to `7d` (optional)
- [ ] `NODE_ENV` - Set to `production` (optional)
- [ ] `CORS_ORIGIN` - Set to your domain(s) (optional)
- [ ] `TRUST_PROXY` - Set to `true` (optional, recommended for Railway)
- [ ] `R2_*` - Set if using video streaming (optional)

---

## 🚨 Common Errors

### **Error: "JWT_ACCESS_SECRET must be at least 32 characters"**
- **Fix:** Make sure your secret is at least 32 characters long

### **Error: "DATABASE_URL must be a valid URL"**
- **Fix:** Check your DATABASE_URL format: `postgresql://user:password@host:port/db?schema=public`

### **Error: "Invalid input: expected string, received undefined"**
- **Fix:** Variable is missing. Add it in Railway Variables tab

---

## 📋 Example Railway Variables

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_ACCESS_SECRET=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
JWT_REFRESH_SECRET=xyz789vwx456stu123pqr901mno678klj345ghi012def789abc
JWT_ACCESS_EXPIRY=30m
JWT_REFRESH_EXPIRY=7d
NODE_ENV=production
CORS_ORIGIN=https://www.z-fitdanceplus.com,https://z-fitdanceplus.com
TRUST_PROXY=true
```

**Note:** Replace the JWT secrets with your own generated secrets!

---

**After adding all variables, redeploy your service!** 🚀

