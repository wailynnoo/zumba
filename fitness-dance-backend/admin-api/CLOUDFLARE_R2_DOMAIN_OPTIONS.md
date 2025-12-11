# Cloudflare R2 Domain Options - Railway vs Custom Domain 🌐

**Date:** 2024-12-11

---

## ⚠️ Important Clarification

Your Railway domain (`https://admin-api-production-5059.up.railway.app`) is for **your API server**, not for serving R2 files directly.

However, you have **several options**:

---

## 🎯 Option 1: Use R2 Public URLs Directly (Simplest)

**No custom domain needed!**

### **How it works:**

- Files are uploaded to R2
- R2 returns URLs like: `https://fitness-dance-videos.179f5226feb953e0ab180f979ae3c55a.r2.cloudflarestorage.com/videos/file.mp4`
- Frontend uses these URLs directly

### **Setup:**

1. Enable **Public Access** in R2 General settings
2. **Don't set** `R2_PUBLIC_URL` (or leave it empty)
3. Code will automatically generate R2 URLs

### **Pros:**

- ✅ No setup needed
- ✅ Works immediately
- ✅ No additional configuration

### **Cons:**

- ❌ Long URLs
- ❌ Not as clean as custom domain

---

## 🎯 Option 2: Proxy Through Railway API (Your Question)

**Use Railway domain to serve R2 files through your API**

### **How it works:**

- Files stored in R2
- API endpoint serves files: `https://admin-api-production-5059.up.railway.app/api/videos/:id/file`
- API fetches from R2 and streams to client

### **Implementation:**

Add this to your API:

```typescript
// src/routes/video.routes.ts
import { Router } from "express";
import { r2StorageService } from "../services/r2-storage.service";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Serve video file through API
router.get("/:id/file", async (req, res) => {
  try {
    const video = await videoService.getVideoById(req.params.id);

    if (!video.cloudflareVideoId) {
      return res.status(404).json({ error: "Video file not found" });
    }

    // Get signed URL from R2 (works even if bucket is private)
    const signedUrl = await r2StorageService.getSignedUrl(
      video.cloudflareVideoId
    );

    // Redirect to signed URL
    res.redirect(signedUrl);

    // OR: Stream file through API (more control, but uses Railway bandwidth)
    // const s3Client = r2StorageService.getS3Client();
    // const command = new GetObjectCommand({
    //   Bucket: env.R2_BUCKET_NAME,
    //   Key: extractKeyFromUrl(video.cloudflareVideoId)
    // });
    // const response = await s3Client.send(command);
    // res.setHeader('Content-Type', response.ContentType || 'video/mp4');
    // response.Body.pipe(res);
  } catch (error) {
    res.status(500).json({ error: "Failed to serve video" });
  }
});
```

### **URL Format:**

```
https://admin-api-production-5059.up.railway.app/api/videos/:id/file
```

### **Pros:**

- ✅ Uses your Railway domain
- ✅ Can add authentication/authorization
- ✅ Can track views/downloads
- ✅ Can add rate limiting

### **Cons:**

- ❌ Uses Railway bandwidth (costs money)
- ❌ Slower (goes through API server)
- ❌ More complex implementation
- ❌ Not ideal for large video files

---

## 🎯 Option 3: Use R2 Public Development URL (For Testing)

**Use the dev URL you already have enabled**

### **Setup:**

```env
R2_PUBLIC_URL=https://pub-65dbb8d5774e47dc8db96cdf0dc65765.r2.dev
```

### **URL Format:**

```
https://pub-65dbb8d5774e47dc8db96cdf0dc65765.r2.dev/videos/file.mp4
```

### **Pros:**

- ✅ Already enabled
- ✅ Quick to test
- ✅ No additional setup

### **Cons:**

- ❌ Rate-limited
- ❌ Not for production
- ❌ Temporary URL

---

## 🎯 Option 4: Custom Domain on Your Own Domain (Best for Production)

**Set up a subdomain on your domain for R2**

### **Example:**

- Your domain: `yourdomain.com`
- R2 subdomain: `cdn.yourdomain.com` or `videos.yourdomain.com`

### **Setup:**

1. In R2 Settings → Custom Domains → Add `cdn.yourdomain.com`
2. Follow Cloudflare DNS setup
3. Set environment variable:
   ```env
   R2_PUBLIC_URL=https://cdn.yourdomain.com
   ```

### **URL Format:**

```
https://cdn.yourdomain.com/videos/file.mp4
```

### **Pros:**

- ✅ Clean, professional URLs
- ✅ Full Cloudflare features
- ✅ Production-ready
- ✅ Better SEO

### **Cons:**

- ❌ Requires your own domain
- ❌ DNS setup needed

---

## 🎯 Option 5: Use Signed URLs (Most Secure)

**Generate time-limited URLs for private access**

### **How it works:**

- Files stored in R2 (private bucket)
- API generates signed URLs when needed
- URLs expire after 1 hour (configurable)

### **Implementation:**

```typescript
// In your video controller
const signedUrl = await r2StorageService.getSignedUrl(
  video.cloudflareVideoId,
  3600
); // 1 hour
return { videoUrl: signedUrl };
```

### **URL Format:**

```
https://fitness-dance-videos.179f5226feb953e0ab180f979ae3c55a.r2.cloudflarestorage.com/videos/file.mp4?X-Amz-Algorithm=...&X-Amz-Signature=...
```

### **Pros:**

- ✅ Most secure
- ✅ Time-limited access
- ✅ Perfect for premium content
- ✅ No public access needed

### **Cons:**

- ❌ URLs expire
- ❌ Need to regenerate for each request
- ❌ Slightly more complex

---

## 💡 Recommendation

### **For Development/Testing:**

- ✅ **Option 3:** Use Public Development URL (already enabled)
- ✅ Quick and easy

### **For Production (No Custom Domain):**

- ✅ **Option 1:** Use R2 public URLs directly
- ✅ **Option 5:** Use signed URLs (if content is premium/private)

### **For Production (With Custom Domain):**

- ✅ **Option 4:** Set up custom domain (best option)

### **If You Want Railway Domain:**

- ⚠️ **Option 2:** Proxy through API (not recommended for large files)
- ⚠️ Only use if you need authentication/tracking

---

## 🚀 Quick Setup Guide

### **Simplest Setup (Recommended):**

1. **Enable Public Access:**

   - R2 → fitness-dance-videos → Settings → General
   - Toggle "Public Access" to Enabled

2. **Don't set R2_PUBLIC_URL:**

   - Leave it empty or don't add it
   - Code will use R2 URLs automatically

3. **That's it!**
   - Files will be at: `https://fitness-dance-videos.179f5226feb953e0ab180f979ae3c55a.r2.cloudflarestorage.com/videos/file.mp4`

---

## 📝 Summary

**Your Railway domain (`admin-api-production-5059.up.railway.app`) is for:**

- ✅ API endpoints (`/api/videos`, `/api/categories`, etc.)
- ✅ Not for serving video files directly

**R2 files should be served from:**

- ✅ R2 public URLs (simplest)
- ✅ Custom domain (best for production)
- ✅ Signed URLs (most secure)
- ⚠️ Railway API proxy (not recommended for large files)

**Recommendation:** Use R2 public URLs directly (Option 1) or set up a custom domain (Option 4) for production.
