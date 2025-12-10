# Security Middleware Implementation ✅

**Date:** 2024-12-06  
**Status:** Implemented

---

## 🔒 Security Issues Addressed

### **Problem:**

- ❌ No security headers (helmet)
- ❌ No rate limiting (vulnerable to DoS)
- ❌ No body size limits (vulnerable to large payload attacks)
- ❌ Missing common security headers

### **Solution:**

- ✅ Helmet middleware for security headers
- ✅ Rate limiting for DoS protection
- ✅ Body size limits for payload protection
- ✅ Strict rate limiting on auth endpoints

---

## 📋 Security Features Implemented

### **1. Helmet - Security Headers**

**Location:** `admin-api/src/middleware/security.middleware.ts`  
**Location:** `member-api/src/middleware/security.middleware.ts`

**Headers Added:**

- `Content-Security-Policy` - Prevents XSS attacks
- `Cross-Origin-Embedder-Policy` - Prevents cross-origin attacks
- `Cross-Origin-Resource-Policy` - Controls resource sharing
- `Strict-Transport-Security` (HSTS) - Forces HTTPS
- `X-Content-Type-Options` - Prevents MIME sniffing
- `X-Frame-Options` - Prevents clickjacking
- `X-XSS-Protection` - Additional XSS protection

**Configuration:**

```typescript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
});
```

---

### **2. Rate Limiting**

#### **General API Rate Limiter**

**Limits:**

- **100 requests per 15 minutes** per IP address
- Applies to all routes except `/health`
- Returns `429 Too Many Requests` when exceeded

**Configuration:**

```typescript
rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/health",
});
```

#### **Auth Endpoint Rate Limiter**

**Limits:**

- **5 requests per 15 minutes** per IP address
- Applies to login, register, refresh, logout endpoints
- Skips successful requests (only counts failures)
- Prevents brute force attacks

**Configuration:**

```typescript
rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true,
});
```

**Applied To:**

- `POST /api/auth/login`
- `POST /api/auth/register` (member-api)
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/verify/email` (member-api)
- `POST /api/auth/verify/phone` (member-api)

---

### **3. Body Size Limits**

**Limits:**

- **JSON:** 1MB maximum
- **URL-encoded:** 10MB maximum

**Configuration:**

```typescript
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
```

**Protection:**

- Prevents large payload DoS attacks
- Prevents memory exhaustion
- Returns `413 Payload Too Large` when exceeded

---

## 📁 Files Modified

### **Admin API:**

1. **`admin-api/src/app.ts`**

   - Added helmet middleware
   - Added general rate limiting
   - Added body size limits

2. **`admin-api/src/middleware/security.middleware.ts`** (NEW)

   - Security headers configuration
   - Rate limiting configurations
   - Body size limit constants

3. **`admin-api/src/routes/auth.routes.ts`**

   - Added strict rate limiting to auth endpoints

4. **`admin-api/package.json`**
   - Added `helmet` dependency
   - Added `express-rate-limit` dependency

### **Member API:**

1. **`member-api/src/app.ts`**

   - Added helmet middleware
   - Added general rate limiting
   - Added body size limits

2. **`member-api/src/middleware/security.middleware.ts`** (NEW)

   - Security headers configuration
   - Rate limiting configurations
   - Body size limit constants

3. **`member-api/src/routes/auth.routes.ts`**

   - Added strict rate limiting to auth endpoints

4. **`member-api/package.json`**
   - Added `helmet` dependency
   - Added `express-rate-limit` dependency

---

## 🛡️ Security Headers Explained

### **Content-Security-Policy (CSP)**

Prevents XSS attacks by controlling which resources can be loaded.

**Our Configuration:**

- `defaultSrc: ["'self'"]` - Only allow resources from same origin
- `scriptSrc: ["'self'"]` - Only allow scripts from same origin
- `styleSrc: ["'self'", "'unsafe-inline'"]` - Allow inline styles (needed for some frameworks)
- `imgSrc: ["'self'", "data:", "https:"]` - Allow images from same origin, data URIs, and HTTPS
- `objectSrc: ["'none'"]` - Block all plugins
- `frameSrc: ["'none'"]` - Prevent embedding in iframes

### **Strict-Transport-Security (HSTS)**

Forces browsers to use HTTPS for all future requests.

**Our Configuration:**

- `maxAge: 31536000` - 1 year
- `includeSubDomains: true` - Apply to all subdomains
- `preload: true` - Allow HSTS preload list

### **Cross-Origin-Resource-Policy**

Prevents cross-origin resource loading attacks.

**Our Configuration:**

- `policy: "cross-origin"` - Allow cross-origin requests (needed for API)

---

## 📊 Rate Limiting Details

### **General API Limiter**

**When Applied:**

- All routes except `/health`
- Applied globally via `app.use(apiLimiter)`

**Response Headers:**

```
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 1234567890
```

**Error Response:**

```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

### **Auth Endpoint Limiter**

**When Applied:**

- Login, register, refresh, logout endpoints
- Applied per route via `router.post("/login", authLimiter, ...)`

**Special Features:**

- `skipSuccessfulRequests: true` - Only counts failed attempts
- Prevents brute force attacks
- Allows legitimate users to retry after failures

**Error Response:**

```json
{
  "success": false,
  "message": "Too many authentication attempts, please try again later."
}
```

---

## 🧪 Testing Security Middleware

### **Test Rate Limiting:**

```bash
# Test general rate limit (should fail after 100 requests)
for i in {1..101}; do
  curl http://localhost:3002/health
done

# Test auth rate limit (should fail after 5 requests)
for i in {1..6}; do
  curl -X POST http://localhost:3002/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

### **Test Body Size Limit:**

```bash
# Create a large JSON payload (>1MB)
curl -X POST http://localhost:3002/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"'$(python -c "print('x' * 2000000)")'"}'
# Should return 413 Payload Too Large
```

### **Test Security Headers:**

```bash
# Check security headers
curl -I http://localhost:3002/health

# Should see:
# Content-Security-Policy: ...
# Strict-Transport-Security: ...
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
```

---

## ⚙️ Configuration Options

### **Environment Variables:**

You can customize rate limits via environment variables (future enhancement):

```env
# Rate limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100           # 100 requests
AUTH_RATE_LIMIT_MAX=5        # 5 auth attempts

# Body size limits
BODY_SIZE_LIMIT_JSON=1mb
BODY_SIZE_LIMIT_URLENCODED=10mb
```

---

## 📈 Performance Impact

### **Helmet:**

- **Overhead:** Minimal (~1-2ms per request)
- **Benefit:** Significant security improvement

### **Rate Limiting:**

- **Overhead:** Minimal (in-memory store)
- **Benefit:** Prevents DoS attacks
- **Note:** For production, consider Redis-backed rate limiting for distributed systems

### **Body Size Limits:**

- **Overhead:** None (built into Express)
- **Benefit:** Prevents memory exhaustion

---

## 🚀 Production Recommendations

### **1. Redis-Backed Rate Limiting**

For distributed systems, use Redis for rate limiting:

```typescript
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: "rl:",
  }),
  // ... rest of config
});
```

### **2. IP Whitelisting**

For admin endpoints, consider IP whitelisting:

```typescript
const adminLimiter = rateLimit({
  skip: (req) => {
    const whitelist = process.env.ADMIN_IP_WHITELIST?.split(",") || [];
    return whitelist.includes(req.ip);
  },
  // ... rest of config
});
```

### **3. Custom Rate Limits per Route**

Different routes may need different limits:

```typescript
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
});
```

---

## ⚠️ Important Notes

### **Rate Limiting:**

- Rate limits are per IP address
- In production behind a proxy, use `trust proxy`:
  ```typescript
  app.set("trust proxy", 1);
  ```

### **Body Size Limits:**

- Adjust limits based on your use case
- File uploads may need separate endpoints with higher limits

### **Security Headers:**

- CSP may need adjustment based on your frontend framework
- Test thoroughly after deployment

---

## 📚 Related Documentation

- [Helmet Documentation](https://helmetjs.github.io/)
- [express-rate-limit Documentation](https://github.com/express-rate-limit/express-rate-limit)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)

---

**Status:** ✅ All security middleware implemented and configured.
