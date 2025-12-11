# Video Upload Debugging Guide 🔍

**Date:** 2024-12-11

---

## ⚠️ Issue

Video uploads were not reaching Cloudflare R2, and there were no logs in the server API.

---

## ✅ Fixes Applied

### **1. Added Comprehensive Logging**

**Backend (`video.controller.ts`):**

- Added detailed logging at each step of the upload process
- Logs include: video ID, file details, R2 configuration status, upload progress, errors

**Backend (`r2-storage.service.ts`):**

- Added logging for R2 initialization and configuration
- Added detailed logging for upload operations
- Logs include: file size, bucket name, endpoint, errors with full details

**Frontend (`videoService.ts`):**

- Added logging for upload requests
- Added error logging with full response details

**Frontend (`videos/page.tsx`):**

- Added logging for upload initiation and completion

### **2. Fixed Frontend FormData Issue**

**Problem:** The frontend was manually setting `Content-Type: multipart/form-data`, which prevents axios from setting the correct boundary.

**Fix:** Removed manual `Content-Type` header - axios automatically sets it with the correct boundary for FormData.

**Files Changed:**

- `admin-web/lib/services/videoService.ts` - Removed manual Content-Type headers from all upload methods

---

## 🔍 How to Debug

### **Step 1: Check Backend Logs**

After deploying, check Railway logs for:

```
[R2 Storage] Initializing R2 Storage Service...
[R2 Storage] Configuration: { ... }
[Video Upload] Starting video upload process...
[Video Upload] File received: { ... }
[R2 Storage] uploadVideo called with: { ... }
```

### **Step 2: Check Frontend Console**

Open browser DevTools Console and look for:

```
[Videos Page] Uploading video file: { ... }
[Video Service] Starting video upload: { ... }
[Video Service] Video upload successful: { ... }
```

### **Step 3: Check Network Tab**

1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Look for `POST /api/videos/:id/video`
4. Check:
   - **Request:** Should have FormData with file
   - **Response:** Should return success with videoUrl

---

## 🚨 Common Issues

### **Issue 1: "R2 storage is not configured"**

**Symptoms:**

- Log shows: `[R2 Storage] R2 credentials not fully configured`
- Error: "R2 storage is not configured"

**Solution:**

- Check Railway environment variables:
  - `R2_ACCOUNT_ID`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_BUCKET_NAME`
  - `R2_ENDPOINT` (optional)
  - `R2_PUBLIC_URL` (optional)

### **Issue 2: "No video file provided"**

**Symptoms:**

- Log shows: `[Video Upload] No file provided in request`
- Error: "No video file provided"

**Possible Causes:**

- Frontend not sending file correctly
- Multer middleware not processing file
- File field name mismatch (should be "video")

**Solution:**

- Check frontend: `formData.append("video", videoFile)` - field name must be "video"
- Check backend route: `uploadVideo.single("video")` - must match frontend field name

### **Issue 3: Upload Request Not Reaching Backend**

**Symptoms:**

- No logs in backend
- 404 error in frontend
- Network tab shows failed request

**Possible Causes:**

- Route not deployed
- Route path mismatch
- Authentication/authorization failure

**Solution:**

- Verify route is registered: `POST /api/videos/:id/video`
- Check Railway deployment logs
- Verify authentication token is valid

### **Issue 4: R2 Upload Fails**

**Symptoms:**

- Log shows: `[R2 Storage] Error uploading video to R2: ...`
- Error details in logs

**Common R2 Errors:**

- **InvalidAccessKeyId:** Wrong `R2_ACCESS_KEY_ID`
- **SignatureDoesNotMatch:** Wrong `R2_SECRET_ACCESS_KEY`
- **NoSuchBucket:** Wrong `R2_BUCKET_NAME`
- **AccessDenied:** Bucket permissions issue

**Solution:**

- Verify R2 credentials in Cloudflare dashboard
- Check bucket name matches exactly
- Verify bucket has public access enabled (if using public URLs)

---

## 📋 Testing Checklist

After deploying, test the following:

- [ ] **Backend Initialization:**

  - [ ] Check logs show R2 Storage Service initialized
  - [ ] Verify R2 configuration is logged correctly

- [ ] **Video Upload:**

  - [ ] Select a video file in the form
  - [ ] Submit the form
  - [ ] Check frontend console for upload logs
  - [ ] Check backend logs for upload process
  - [ ] Verify file appears in Cloudflare R2 bucket
  - [ ] Verify video record in database has `cloudflareVideoId`

- [ ] **Error Handling:**
  - [ ] Test with invalid file type (should show error)
  - [ ] Test with file too large (should show error)
  - [ ] Test without R2 credentials (should show error)

---

## 🔧 Next Steps

1. **Deploy the updated code to Railway**
2. **Check Railway logs** for R2 initialization
3. **Test video upload** and check both frontend and backend logs
4. **Verify file appears in R2 bucket** (check Cloudflare dashboard)
5. **If errors occur**, use the logs to identify the issue

---

## 📝 Log Examples

### **Successful Upload:**

**Frontend:**

```
[Videos Page] Uploading video file: { videoId: "...", fileName: "video.mp4", fileSize: 1234567 }
[Video Service] Starting video upload: { ... }
[Video Service] Video upload successful: { ... }
```

**Backend:**

```
[Video Upload] Starting video upload process...
[Video Upload] Video ID: abc-123
[Video Upload] File received: { originalname: "video.mp4", mimetype: "video/mp4", size: 1234567 }
[Video Upload] R2 storage is configured, proceeding...
[R2 Storage] uploadVideo called with: { fileName: "video-123.mp4", contentType: "video/mp4", fileSize: 1234567 }
[R2 Storage] Uploading to key: videos/video-123.mp4
[R2 Storage] Sending PutObjectCommand to R2...
[R2 Storage] PutObjectCommand successful!
[R2 Storage] Generated public URL: https://...
[Video Upload] Upload successful! Video URL: https://...
```

### **Error Example:**

**Backend:**

```
[R2 Storage] Error uploading video to R2: AccessDenied
[R2 Storage] Error details: { message: "Access Denied", code: "AccessDenied", ... }
[Video Upload] Error: Failed to upload video to R2: Access Denied
```

---

**With these logs, you should be able to identify exactly where the upload process is failing!** 🔍
