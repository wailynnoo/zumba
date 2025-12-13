# Video Access Control Discussion 🔒

**Date:** 2024-12-11

---

## ⚠️ Current Problem

**Videos are publicly accessible!** Anyone with the URL can watch any video, even if they're not:

- A registered member
- A subscription user (for premium videos)

---

## 🎯 Requirements

1. **All Videos:** Only accessible to authenticated app members
2. **Premium Videos:** Only accessible to subscription users
3. **Free Videos:** Accessible to all authenticated members

---

## 💡 Solution Options

### **Option 1: Signed URLs (Recommended) ⭐**

**How it works:**

- Videos stored in **private R2 bucket** (no public access)
- When user requests to watch a video:
  1. Backend checks if user is authenticated
  2. Backend checks if user has subscription (for premium videos)
  3. If authorized, backend generates a **time-limited signed URL** (expires in 1 hour)
  4. Frontend uses signed URL to play video
  5. Signed URL expires after time limit

**Implementation:**

```
User clicks "Play Video"
  ↓
Frontend calls: GET /api/videos/:id/watch-url
  ↓
Backend checks:
  - Is user authenticated? ✅
  - Is video premium? → Check subscription ✅
  - Generate signed URL (expires in 1 hour)
  ↓
Return signed URL to frontend
  ↓
Frontend plays video using signed URL
```

**Pros:**

- ✅ Secure - videos are private
- ✅ Time-limited access (1 hour expiry)
- ✅ No bandwidth cost on Railway (direct from R2)
- ✅ Fast (direct R2 access, not through API)
- ✅ Already have `getSignedUrl` method in R2 service

**Cons:**

- ⚠️ Need to refresh signed URL if video is long (>1 hour)
- ⚠️ Need to make R2 bucket private

---

### **Option 2: API Proxy (More Control)**

**How it works:**

- Videos stored in private R2 bucket
- Backend serves videos through API endpoint
- Backend checks authentication/subscription before streaming

**Implementation:**

```
User clicks "Play Video"
  ↓
Frontend calls: GET /api/videos/:id/stream
  ↓
Backend checks:
  - Is user authenticated? ✅
  - Is video premium? → Check subscription ✅
  ↓
Backend streams video from R2 to user
```

**Pros:**

- ✅ Full control over access
- ✅ Can track views in real-time
- ✅ Can add rate limiting
- ✅ Can add analytics

**Cons:**

- ❌ Uses Railway bandwidth (costs money)
- ❌ Slower (goes through API server)
- ❌ More complex (need to handle streaming)
- ❌ Not ideal for large files

---

### **Option 3: Hybrid Approach (Best of Both)**

**How it works:**

- Use signed URLs for video playback (fast, no bandwidth cost)
- Use API endpoint for access control and analytics
- API generates signed URL after validation

**Implementation:**

```
User clicks "Play Video"
  ↓
Frontend calls: GET /api/videos/:id/watch-url
  ↓
Backend:
  1. Check authentication ✅
  2. Check subscription (if premium) ✅
  3. Log view/analytics
  4. Generate signed URL
  ↓
Return signed URL
  ↓
Frontend plays video directly from R2
```

**Pros:**

- ✅ Secure access control
- ✅ Fast playback (direct R2)
- ✅ Can track views
- ✅ No Railway bandwidth cost
- ✅ Best of both worlds

**Cons:**

- ⚠️ Need to refresh signed URL for long videos

---

## 🏗️ Recommended Implementation: Option 3 (Hybrid)

### **Step 1: Make R2 Bucket Private**

1. Go to Cloudflare R2 → Your bucket
2. **Disable Public Access** (make bucket private)
3. Videos will no longer be publicly accessible

### **Step 2: Create Watch URL Endpoint**

**Backend:** `GET /api/videos/:id/watch-url`

**Flow:**

1. Authenticate user (JWT token)
2. Get video from database
3. Check if video is premium (`videoType === "premium"`)
4. If premium, check user subscription status
5. If authorized, generate signed URL (1 hour expiry)
6. Return signed URL

**Code Structure:**

```typescript
// GET /api/videos/:id/watch-url
async getVideoWatchUrl(req, res) {
  // 1. Authenticate user
  const userId = req.user.id;

  // 2. Get video
  const video = await videoService.getVideoById(req.params.id);

  // 3. Check if premium
  if (video.videoType === "premium") {
    // Check subscription
    const member = await memberService.getMemberById(userId);
    if (!member.hasActiveSubscription) {
      return res.status(403).json({ error: "Subscription required" });
    }
  }

  // 4. Generate signed URL
  const signedUrl = await r2StorageService.getSignedUrl(
    video.cloudflareVideoId,
    3600 // 1 hour
  );

  // 5. Log view (optional)
  await videoService.incrementViewCount(video.id);

  // 6. Return signed URL
  res.json({ watchUrl: signedUrl });
}
```

### **Step 3: Frontend Integration**

**Frontend:** When user clicks play, call watch URL endpoint

```typescript
// Get watch URL
const response = await api.get(`/api/videos/${videoId}/watch-url`);
const watchUrl = response.data.watchUrl;

// Play video using watchUrl
<video src={watchUrl} controls />;
```

### **Step 4: Handle URL Expiry**

For long videos (>1 hour), refresh signed URL before expiry:

```typescript
// Refresh signed URL every 50 minutes
useEffect(() => {
  const interval = setInterval(async () => {
    const newUrl = await getWatchUrl(videoId);
    setVideoUrl(newUrl);
  }, 50 * 60 * 1000); // 50 minutes

  return () => clearInterval(interval);
}, [videoId]);
```

---

## 📋 Database Changes Needed

### **Check Member Subscription Status**

Need to verify how subscriptions are stored. Options:

1. **Member model has subscription fields:**

   ```prisma
   model Member {
     hasActiveSubscription Boolean
     subscriptionExpiresAt DateTime?
   }
   ```

2. **Separate Subscription model:**
   ```prisma
   model Subscription {
     memberId String
     isActive Boolean
     expiresAt DateTime?
   }
   ```

---

## 🔐 Security Considerations

1. **Signed URL Expiry:** 1 hour is good balance (security vs UX)
2. **Token Validation:** Always validate JWT on watch URL endpoint
3. **Rate Limiting:** Limit watch URL requests per user
4. **Video Access Logging:** Track who watches what (for analytics)

---

## 🚀 Implementation Steps

1. ✅ Make R2 bucket private
2. ✅ Create `GET /api/videos/:id/watch-url` endpoint
3. ✅ Add authentication check
4. ✅ Add subscription check for premium videos
5. ✅ Update frontend to use watch URL endpoint
6. ✅ Add signed URL refresh for long videos
7. ✅ Test with different user types (free, premium)

---

## ❓ Questions to Answer

1. **How are subscriptions stored?** (Member model or separate Subscription model?)
2. **What's the subscription status field?** (`hasActiveSubscription`, `isPremium`, etc.)
3. **Should we track video views?** (increment view count when URL is generated)
4. **Signed URL expiry time?** (1 hour recommended, but can adjust)

---

**Let me know your preferences and I'll implement the solution!** 🎯
