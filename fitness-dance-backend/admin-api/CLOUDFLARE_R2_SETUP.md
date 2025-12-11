# Cloudflare R2 Setup Guide 📦

**Date:** 2024-12-11  
**Status:** ✅ Ready for Configuration

---

## 🎯 Overview

This guide explains how to set up Cloudflare R2 for video storage in the Fitness Dance Admin API.

**Cloudflare R2** is an S3-compatible object storage service that:

- ✅ No egress fees (unlike AWS S3)
- ✅ S3-compatible API (works with AWS SDK)
- ✅ Global CDN integration
- ✅ Pay only for storage

---

## 📋 Prerequisites

1. ✅ Cloudflare account (you already have this!)
2. ✅ R2 bucket created
3. ✅ API tokens generated

---

## 🔧 Step 1: Create R2 Bucket

1. **Log in to Cloudflare Dashboard**

   - Go to: https://dash.cloudflare.com
   - Navigate to: **R2** → **Create bucket**

2. **Bucket Settings:**

   - **Bucket name:** `fitness-dance-videos` (or your preferred name)
   - **Location:** Choose closest to your users
   - **Public access:**
     - Option A: Make bucket public (simpler, but less secure)
     - Option B: Use signed URLs (recommended for private videos)

3. **Click "Create bucket"**

---

## 🔑 Step 2: Create API Token

1. **Go to R2 Dashboard**

   - Navigate to: **R2** → **Manage R2 API Tokens**

2. **Create API Token:**

   - Click **"Create API token"**
   - **Token name:** `fitness-dance-admin-api`
   - **Permissions:**
     - ✅ **Object Read & Write** (for upload/delete)
     - ✅ **Admin Read** (optional, for bucket management)

3. **Save Credentials:**

   - **Access Key ID** (save this!)
   - **Secret Access Key** (save this! - shown only once)

4. **Get Account ID:**
   - Go to: **R2** → **Overview**
   - Copy your **Account ID**

---

## 🌐 Step 3: Configure Custom Domain (Optional but Recommended)

For better performance and custom URLs:

1. **Go to R2 Bucket Settings**

   - Click on your bucket → **Settings** → **Public Access**

2. **Connect Custom Domain:**
   - Add your domain (e.g., `cdn.yourdomain.com`)
   - Follow Cloudflare's DNS setup instructions
   - This gives you: `https://cdn.yourdomain.com/videos/file.mp4`

**Benefits:**

- ✅ Custom domain URLs
- ✅ Better SEO
- ✅ Easier to manage

---

## ⚙️ Step 4: Environment Variables

Add these to your `.env` file (and Railway environment variables):

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=fitness-dance-videos
R2_ENDPOINT=https://{account_id}.r2.cloudflarestorage.com

# Optional: Custom domain public URL
R2_PUBLIC_URL=https://cdn.yourdomain.com
```

**For Railway:**

1. Go to your Railway project
2. Select the `admin-api` service
3. Go to **Variables** tab
4. Add each variable above

---

## 📁 Step 5: R2 Bucket Structure

Files will be organized as:

```
fitness-dance-videos/
├── videos/
│   ├── video-1234567890-987654321.mp4
│   └── video-1234567891-987654322.webm
├── thumbnails/
│   ├── thumbnail-1234567890-987654321.jpg
│   └── thumbnail-1234567891-987654322.png
└── audio/
    ├── audio-1234567890-987654321.mp3
    └── audio-1234567891-987654322.m4a
```

---

## 🔒 Step 6: Security Considerations

### **Option A: Public Bucket (Simple)**

- ✅ Easy setup
- ✅ No signed URLs needed
- ❌ All files publicly accessible
- **Use case:** Public videos only

### **Option B: Private Bucket + Signed URLs (Recommended)**

- ✅ Secure access
- ✅ Time-limited URLs
- ✅ Better for premium content
- **Implementation:** Use `r2StorageService.getSignedUrl()` for private videos

---

## 🧪 Step 7: Test Upload

Once configured, test with:

```bash
# Create a video
POST /api/videos
{
  "title": "Test Video",
  "categoryId": "...",
  "danceStyleId": "...",
  "intensityLevelId": "..."
}

# Upload video file
POST /api/videos/:id/video
Content-Type: multipart/form-data
Form field: video (file)
```

---

## 💰 Pricing

**Cloudflare R2 Pricing:**

- **Storage:** $0.015 per GB/month
- **Class A Operations (write):** $4.50 per million
- **Class B Operations (read):** $0.36 per million
- **No egress fees!** (unlike AWS S3)

**Example:**

- 100GB storage = $1.50/month
- 1M video uploads = $4.50
- 10M video views = $3.60
- **Total: ~$9.60/month** (much cheaper than S3!)

---

## 🚀 Next Steps

1. ✅ Create R2 bucket
2. ✅ Generate API tokens
3. ✅ Add environment variables
4. ✅ Test video upload
5. ✅ (Optional) Set up custom domain

---

## 📝 Notes

- **File Size Limits:**

  - Videos: 500MB max (configurable in `upload.middleware.ts`)
  - Thumbnails: 10MB max
  - Audio: 50MB max

- **Supported Formats:**

  - Videos: mp4, webm, mov, avi, mkv
  - Thumbnails: jpeg, jpg, png, webp
  - Audio: mp3, wav, ogg, m4a, aac

- **Error Handling:**
  - If R2 is not configured, uploads will fail gracefully
  - Check logs for R2 configuration errors

---

## 🔍 Troubleshooting

### **Error: "R2 storage is not configured"**

- ✅ Check environment variables are set
- ✅ Verify `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` are correct

### **Error: "Access Denied"**

- ✅ Check API token permissions
- ✅ Verify bucket name is correct
- ✅ Ensure bucket exists in your account

### **Error: "Invalid endpoint"**

- ✅ Check `R2_ENDPOINT` format
- ✅ Should be: `https://{account_id}.r2.cloudflarestorage.com`
- ✅ Replace `{account_id}` with your actual account ID

---

**Setup Complete!** 🎉

Once configured, video uploads will automatically use Cloudflare R2 for storage.
