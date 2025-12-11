# Trust Proxy Fix for Railway 🚀

**Date:** 2024-12-11

---

## ⚠️ Issue

The rate limiter was throwing an error:

```
ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false
```

This was blocking requests (including video uploads) from reaching the backend endpoints.

---

## ✅ Root Cause

Railway (and most cloud platforms) run behind a reverse proxy/load balancer that sends `X-Forwarded-For` headers. The rate limiter requires `trust proxy` to be enabled to correctly identify client IPs, but it was disabled by default.

---

## 🔧 Fixes Applied

### **1. Updated Environment Variable Default**

**File:** `src/config/env.ts`

Changed `TRUST_PROXY` to default to `true` in production:

```typescript
TRUST_PROXY: z
  .string()
  .optional()
  .transform((val) => {
    // If explicitly set, use that value
    if (val !== undefined) {
      return val === "true" || val === "1";
    }
    // Otherwise, default to true in production
    return process.env.NODE_ENV === "production";
  }),
```

**Result:** On Railway (production), `TRUST_PROXY` will automatically be `true` unless explicitly set to `false`.

### **2. Updated Rate Limiter**

**File:** `src/middleware/security.middleware.ts`

Added file upload endpoints to the skip list so they're not rate limited:

```typescript
skip: (req) => {
  // Skip rate limiting for health checks and file upload endpoints
  // File uploads are large and should not be rate limited the same way
  return req.path === "/health" ||
         req.path.includes("/video") ||
         req.path.includes("/thumbnail") ||
         req.path.includes("/audio");
},
```

**Result:** File upload endpoints bypass the general rate limiter (they still have size limits via Multer).

---

## 📋 What This Fixes

1. ✅ **Rate Limiter Error:** No more `X-Forwarded-For` validation errors
2. ✅ **Video Uploads:** Requests can now reach the upload endpoint
3. ✅ **IP Identification:** Rate limiter can correctly identify client IPs behind Railway's proxy
4. ✅ **File Upload Performance:** Large file uploads are not rate limited

---

## 🧪 Testing

After deploying, you should see:

1. **No more rate limiter errors** in Railway logs
2. **Video upload logs** appearing:
   ```
   [Video Upload] Starting video upload process...
   [R2 Storage] uploadVideo called with: ...
   ```
3. **Successful uploads** to Cloudflare R2

---

## 🔍 Verification

Check Railway logs for:

**Before (Error):**

```
ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false
```

**After (Success):**

```
[App] Trust proxy: enabled (NODE_ENV: production)
[Video Upload] Starting video upload process...
```

---

## 📝 Environment Variables

**Optional:** You can explicitly set `TRUST_PROXY=true` in Railway if you want to be explicit, but it's not required - it will default to `true` in production.

**For local development:** If you're behind a proxy locally, set `TRUST_PROXY=true` in your `.env` file.

---

**This fix should resolve the rate limiter error and allow video uploads to work!** 🎉
