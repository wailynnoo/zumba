# Cloudflare R2 Setup - Step by Step Guide 📦

**Based on your current Cloudflare dashboard**

---

## ✅ What You Already Have

From your dashboard, I can see:

- ✅ **Bucket created:** `fitness-dance-videos`
- ✅ **Account ID:** `179f5226feb953e0ab180f979ae3c55a`
- ✅ **Location:** Asia-Pacific (APAC)
- ✅ **S3 API Endpoint:** `https://179f5226feb953e0ab180f979ae3c55a.r2.cloudflarestorage.com`
- ⚠️ **Public Access:** Currently **Disabled**
- ⚠️ **API Tokens:** Not created yet

---

## 🔑 Step 1: Create API Token

### **Option A: Account API Token (Recommended for Production)**

1. **Go to API Tokens Page:**

   - You're already on: `dash.cloudflare.com/.../r2/api-tokens`
   - Or navigate: **R2** → **Manage R2 API Tokens**

2. **Click "Create Account API token"** (blue button)

3. **Fill in the form:**

   - **Token name:** `fitness-dance-admin-api` (or any name you prefer)
   - **Permissions:**
     - ✅ **Object Read & Write** (for upload/delete files)
     - ✅ **Admin Read** (optional, for bucket management)
   - **Bucket access:**
     - Select: **fitness-dance-videos**
     - Or: **All buckets** (if you want to use multiple buckets)

4. **Click "Create API token"**

5. **IMPORTANT: Save the credentials immediately!**
   - **Access Key ID:** `xxxxxxxxxxxxx` (copy this!)
   - **Secret Access Key:** `xxxxxxxxxxxxx` (copy this! - shown only once)
   - ⚠️ **You won't be able to see the secret again!**

---

## ⚙️ Step 2: Configure Environment Variables

Add these to your `.env` file (local) and Railway environment variables:

### **For Local Development (.env file):**

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=179f5226feb953e0ab180f979ae3c55a
R2_ACCESS_KEY_ID=your_access_key_id_from_step_1
R2_SECRET_ACCESS_KEY=your_secret_access_key_from_step_1
R2_BUCKET_NAME=fitness-dance-videos
R2_ENDPOINT=https://179f5226feb953e0ab180f979ae3c55a.r2.cloudflarestorage.com
```

### **For Railway (Production):**

1. Go to your Railway project
2. Select the `admin-api` service
3. Go to **Variables** tab
4. Click **"New Variable"** for each:

   ```
   Name: R2_ACCOUNT_ID
   Value: 179f5226feb953e0ab180f979ae3c55a
   ```

   ```
   Name: R2_ACCESS_KEY_ID
   Value: [paste your Access Key ID from Step 1]
   ```

   ```
   Name: R2_SECRET_ACCESS_KEY
   Value: [paste your Secret Access Key from Step 1]
   ```

   ```
   Name: R2_BUCKET_NAME
   Value: fitness-dance-videos
   ```

   ```
   Name: R2_ENDPOINT
   Value: https://179f5226feb953e0ab180f979ae3c55a.r2.cloudflarestorage.com
   ```

---

## 🔓 Step 3: Configure Public Access (Choose One Option)

### **Option A: Enable Public Access (Simpler - Recommended for Testing)**

1. **Go to Bucket Settings:**

   - Navigate to: **R2** → **fitness-dance-videos** → **Settings** tab
   - Or go to: `dash.cloudflare.com/.../r2/default/buckets/fitness-dance-videos/settings`

2. **Enable Public Access:**

   - Find **"Public Access"** section
   - Toggle it to **"Enabled"**
   - This allows direct public URLs to your files

3. **Benefits:**

   - ✅ Simple setup
   - ✅ Direct file URLs work immediately
   - ✅ No signed URLs needed

4. **Note:**
   - All files in the bucket will be publicly accessible
   - Use this if your videos are meant to be public

---

### **Option B: Keep Private + Use Signed URLs (More Secure)**

1. **Keep Public Access Disabled** (current setting)

2. **Use Signed URLs:**

   - The code already supports this
   - Files are private by default
   - Generate time-limited signed URLs when needed
   - Better for premium/private content

3. **Implementation:**
   - The `r2StorageService.getSignedUrl()` method handles this
   - URLs expire after 1 hour (configurable)

---

## 🌐 Step 4: Set Up Custom Domain (Optional but Recommended)

For better performance and custom URLs:

1. **Go to Bucket Settings:**

   - Navigate to: **Settings** → **Custom Domains** section

2. **Click "+ Add" button**

3. **Add Your Domain:**

   - Enter your domain (e.g., `cdn.yourdomain.com`)
   - Follow Cloudflare's DNS setup instructions
   - This gives you: `https://cdn.yourdomain.com/videos/file.mp4`

4. **After Setup:**
   - Add to `.env`:
     ```env
     R2_PUBLIC_URL=https://cdn.yourdomain.com
     ```

**Benefits:**

- ✅ Custom domain URLs
- ✅ Better SEO
- ✅ Easier to manage
- ✅ Can use your own CDN

---

## 🧪 Step 5: Test the Setup

### **Test Locally:**

1. **Start your server:**

   ```bash
   cd admin-api
   npm run dev
   ```

2. **Create a test video:**

   ```bash
   POST http://localhost:3002/api/videos
   {
     "title": "Test Video",
     "categoryId": "your-category-id",
     "danceStyleId": "your-dance-style-id",
     "intensityLevelId": "your-intensity-level-id"
   }
   ```

3. **Upload a video file:**

   ```bash
   POST http://localhost:3002/api/videos/:id/video
   Content-Type: multipart/form-data
   Form field: video (select a video file)
   ```

4. **Check R2 Bucket:**
   - Go to: **R2** → **fitness-dance-videos** → **Objects** tab
   - You should see: `videos/video-xxxxx.mp4`

---

## 📋 Quick Reference

### **Your Current Values:**

```
Account ID: 179f5226feb953e0ab180f979ae3c55a
Bucket Name: fitness-dance-videos
S3 Endpoint: https://179f5226feb953e0ab180f979ae3c55a.r2.cloudflarestorage.com
Location: Asia-Pacific (APAC)
```

### **Environment Variables Template:**

```env
R2_ACCOUNT_ID=179f5226feb953e0ab180f979ae3c55a
R2_ACCESS_KEY_ID=[from API token creation]
R2_SECRET_ACCESS_KEY=[from API token creation]
R2_BUCKET_NAME=fitness-dance-videos
R2_ENDPOINT=https://179f5226feb953e0ab180f979ae3c55a.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://cdn.yourdomain.com  # Optional, if you set up custom domain
```

---

## 🔍 Troubleshooting

### **Error: "R2 storage is not configured"**

- ✅ Check all environment variables are set
- ✅ Verify `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` are correct
- ✅ Restart your server after adding env variables

### **Error: "Access Denied"**

- ✅ Check API token permissions (need "Object Read & Write")
- ✅ Verify bucket name is correct: `fitness-dance-videos`
- ✅ Ensure token has access to the bucket

### **Error: "Public access denied"**

- ✅ If Public Access is disabled, files won't be publicly accessible
- ✅ Either enable Public Access in bucket settings
- ✅ Or use signed URLs for private access

### **Files not appearing in R2 bucket:**

- ✅ Check upload was successful (check API response)
- ✅ Go to **R2** → **fitness-dance-videos** → **Objects** tab
- ✅ Files should be in `videos/`, `thumbnails/`, or `audio/` folders

---

## ✅ Checklist

- [ ] API token created (Account API Token)
- [ ] Access Key ID saved
- [ ] Secret Access Key saved
- [ ] Environment variables added to `.env` (local)
- [ ] Environment variables added to Railway (production)
- [ ] Public Access configured (enabled or using signed URLs)
- [ ] (Optional) Custom domain set up
- [ ] Test upload successful
- [ ] Files visible in R2 bucket

---

## 🚀 Next Steps After Setup

1. ✅ Test video upload via API
2. ✅ Verify files appear in R2 bucket
3. ✅ Test video URLs work (public or signed)
4. ✅ Integrate with frontend
5. ✅ Deploy to Railway with env variables

---

**You're almost there!** Just create the API token and add the environment variables. 🎉
