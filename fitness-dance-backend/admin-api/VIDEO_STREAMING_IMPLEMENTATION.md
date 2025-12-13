# Video Streaming Implementation (API Proxy) 🔒

**Date:** 2024-12-11  
**Implementation:** Option 2 - API Proxy (More Control)

---

## ✅ Implementation Complete

Video streaming has been implemented using **API Proxy** approach for admin panel. Admin users can now stream videos through the API endpoint with proper authentication (no subscription check needed).

---

## 🎯 What Was Implemented

### **Backend (Admin API)**

1. **R2StorageService Updates** (`src/services/r2-storage.service.ts`)

   - Added `getS3Client()` method to access S3 client for streaming
   - Added `getBucketName()` method to get bucket name
   - Added `extractKey()` method to extract R2 key from URL
   - Added `getObjectMetadata()` method (for future use)

2. **Video Controller** (`src/controllers/video.controller.ts`)

   - Added `streamVideo()` method that:
     - Authenticates admin user (no subscription check)
     - Gets video from database
     - Uses `HeadObjectCommand` to get file metadata (Content-Length, Content-Type)
     - Parses HTTP Range header for video seeking
     - Streams video from R2 with proper range support
     - Sets correct HTTP headers (Content-Range, Accept-Ranges, etc.)
     - Handles ReadableStream from AWS SDK v3

3. **Video Routes** (`src/routes/video.routes.ts`)

   - Added `GET /api/videos/:id/stream` route
   - Protected with `authenticate` and `requirePermission("videos", "read")`

4. **CORS Configuration** (`src/app.ts`)
   - Added `Range` to `allowedHeaders` for video streaming
   - Added `Content-Range`, `Accept-Ranges`, `Content-Length` to `exposedHeaders`

### **Frontend (Admin Web)**

1. **Video Service** (`lib/services/videoService.ts`)

   - Added `getVideoStreamUrl(videoId)` method
   - Returns full API URL for video streaming endpoint

2. **Video Edit Page** (`app/dashboard/videos/edit/[id]/page.tsx`)
   - Updated to use streaming endpoint instead of direct R2 URL
   - Uses `videoService.getVideoStreamUrl()` for video preview

---

## 🔐 Security Features

1. **Authentication Required:** All video streaming requires valid admin JWT token
2. **Permission Check:** Admin must have `read` permission on `videos` resource
3. **No Subscription Check:** Admin users don't need subscription (as requested)
4. **Range Request Support:** Properly handles HTTP Range requests for video seeking

---

## 📡 API Endpoint

**Endpoint:** `GET /api/videos/:id/stream`

**Headers:**

- `Authorization: Bearer <admin_jwt_token>` (required)
- `Range: bytes=start-end` (optional, for video seeking)

**Response:**

- Status: `200 OK` (full video) or `206 Partial Content` (range request)
- Headers:
  - `Content-Type: video/mp4` (or actual video MIME type)
  - `Content-Length: <chunk_size>`
  - `Content-Range: bytes <start>-<end>/<total>` (for range requests)
  - `Accept-Ranges: bytes`
  - `Cache-Control: public, max-age=3600`

**Example:**

```bash
curl -H "Authorization: Bearer <token>" \
     -H "Range: bytes=0-1023" \
     https://admin-api.example.com/api/videos/<video-id>/stream
```

---

## 🎬 How It Works

1. **User requests video:**

   - Frontend calls `videoService.getVideoStreamUrl(videoId)`
   - Returns: `https://admin-api.example.com/api/videos/<id>/stream`

2. **Video player requests stream:**

   - Browser makes GET request to streaming endpoint
   - Includes `Authorization` header with JWT token
   - Optionally includes `Range` header for seeking

3. **Backend processes request:**

   - Authenticates admin user
   - Checks permissions
   - Gets video metadata from R2 (using HeadObjectCommand)
   - Parses Range header if provided
   - Streams video chunk from R2 to client

4. **Video plays:**
   - Browser receives video stream
   - Video player can seek using Range requests
   - Streams directly from API (goes through Railway)

---

## ⚠️ Important Notes

1. **Bandwidth Cost:** Videos stream through Railway API, so Railway bandwidth is used (costs money)
2. **Performance:** Slightly slower than direct R2 access (goes through API server)
3. **Range Requests:** Fully supported for video seeking
4. **Caching:** Response includes `Cache-Control` header for browser caching

---

## 🚀 Next Steps (For Member App)

For the member app, you'll want to implement:

1. **Signed URLs** (Option 1) - Better for production (no Railway bandwidth cost)
2. **Subscription Check** - Verify user has active subscription for premium videos
3. **View Tracking** - Log video views when streaming starts

See `VIDEO_ACCESS_CONTROL_IMPLEMENTATION.md` for member app implementation plan.

---

## 📝 Files Modified

### Backend

- `admin-api/src/services/r2-storage.service.ts`
- `admin-api/src/controllers/video.controller.ts`
- `admin-api/src/routes/video.routes.ts`
- `admin-api/src/app.ts` (CORS configuration)

### Frontend

- `admin-web/lib/services/videoService.ts`
- `admin-web/app/dashboard/videos/edit/[id]/page.tsx`

---

## ✅ Testing Checklist

- [ ] Test video streaming with authenticated admin user
- [ ] Test video seeking (Range requests)
- [ ] Test with different video formats (mp4, webm, etc.)
- [ ] Test error handling (invalid video ID, no permission, etc.)
- [ ] Test CORS (if admin-web is on different domain)
- [ ] Verify video plays correctly in browser

---

**Implementation Status:** ✅ Complete  
**Ready for Testing:** ✅ Yes
