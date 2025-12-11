# R2 Public URL Setup 🔗

**Date:** 2024-12-11

---

## ⚠️ Issue

The API is returning R2 storage endpoint URLs instead of public URLs:

- **Wrong:** `https://fitness-dance-videos.179f5226feb953e0ab180f979ae3c55a.r2.cloudflarestorage.com/videos/...`
- **Correct:** `https://pub-65dbb8d5774e47dc8db96cdf0dc65765.r2.dev/videos/...`

The storage endpoint URL is **NOT publicly accessible** and videos won't play.

---

## ✅ Solution

Set the `R2_PUBLIC_URL` environment variable in Railway.

### **Step 1: Find Your R2 Public URL**

1. Go to Cloudflare Dashboard → R2 → Your Bucket (`fitness-dance-videos`)
2. Check the **"Public Access"** section
3. You should see: `https://pub-65dbb8d5774e47dc8db96cdf0dc65765.r2.dev`
4. Copy this URL

### **Step 2: Set Environment Variable in Railway**

1. Go to Railway Dashboard → Your `admin-api` service
2. Go to **Variables** tab
3. Add new variable:
   - **Name:** `R2_PUBLIC_URL`
   - **Value:** `https://pub-65dbb8d5774e47dc8db96cdf0dc65765.r2.dev`
4. Save and redeploy

### **Step 3: Verify**

After redeploying, test video upload again. The API should now return:

```
"cloudflareVideoId": "https://pub-65dbb8d5774e47dc8db96cdf0dc65765.r2.dev/videos/video-xxx.mp4"
```

---

## 🔍 URL Format Explanation

### **Storage Endpoint URL (NOT Public)**

```
https://{bucket-name}.{account-id}.r2.cloudflarestorage.com/{key}
```

- Used for API operations (upload, delete)
- **NOT publicly accessible**
- Requires authentication

### **Public URL (Publicly Accessible)**

```
https://pub-{random-id}.r2.dev/{key}
```

- Publicly accessible
- No authentication required
- Videos can be played directly in browser
- Found in Cloudflare R2 bucket settings

---

## 📋 Environment Variables Checklist

Make sure these are set in Railway:

- ✅ `R2_ACCOUNT_ID` - Your Cloudflare account ID
- ✅ `R2_ACCESS_KEY_ID` - R2 API token access key
- ✅ `R2_SECRET_ACCESS_KEY` - R2 API token secret
- ✅ `R2_BUCKET_NAME` - `fitness-dance-videos`
- ✅ `R2_PUBLIC_URL` - `https://pub-65dbb8d5774e47dc8db96cdf0dc65765.r2.dev` ⬅️ **ADD THIS**

---

## 🧪 Testing Video Playback

After setting `R2_PUBLIC_URL`:

1. Upload a video
2. Check the returned `cloudflareVideoId` URL
3. Open the URL in a browser - video should play
4. Or test in your frontend video player

---

## ⚠️ Important Notes

- **Both URLs point to the same file** - they're just different access methods
- **Storage endpoint** = Private (API only)
- **Public URL** = Public (browser accessible)
- If `R2_PUBLIC_URL` is not set, uploads will **fail** with an error message

---

**Once `R2_PUBLIC_URL` is set, videos will be accessible and playable!** 🎉
