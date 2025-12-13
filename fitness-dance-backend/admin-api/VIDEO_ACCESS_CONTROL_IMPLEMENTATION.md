# Video Access Control Implementation Plan 🔒

**Date:** 2024-12-11

---

## 🎯 Requirements

1. **All Videos:** Only accessible to authenticated app members (not public)
2. **Premium Videos (`videoType: "premium"`):** Only accessible to users with active subscription
3. **Free Videos (`videoType: "youtube_short"` or other):** Accessible to all authenticated members

---

## ✅ Recommended Solution: Signed URLs (Hybrid Approach)

**Why this is best:**

- ✅ Secure (videos are private in R2)
- ✅ Fast (direct R2 access, no Railway bandwidth)
- ✅ Time-limited (signed URLs expire after 1 hour)
- ✅ Already have `getSignedUrl` method ready
- ✅ Can track views and analytics

---

## 🏗️ Implementation Plan

### **Step 1: Make R2 Bucket Private**

1. Go to Cloudflare R2 Dashboard
2. Select your bucket (`fitness-dance-videos`)
3. Go to **Settings** → **Public Access**
4. **Disable Public Access** (make bucket private)
5. Videos will no longer be publicly accessible

**Note:** After this, existing public URLs will stop working. We'll use signed URLs instead.

---

### **Step 2: Create Watch URL Endpoint**

**New Endpoint:** `GET /api/videos/:id/watch-url`

**Purpose:** Generate signed URL after checking user permissions

**Flow:**

```
1. User requests to watch video
2. Frontend calls: GET /api/videos/:id/watch-url
3. Backend:
   - Authenticate user (JWT token)
   - Get video from database
   - Check if video is premium
   - If premium → Check user has active subscription
   - Generate signed URL (expires in 1 hour)
   - Return signed URL
4. Frontend plays video using signed URL
```

---

### **Step 3: Create Subscription Check Service**

**New Service:** `src/services/subscription.service.ts`

**Purpose:** Check if user has active subscription

**Logic:**

```typescript
async hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "active",
      expiresAt: { gt: new Date() }, // Not expired
    },
    orderBy: { expiresAt: "desc" },
  });

  return !!subscription;
}
```

---

### **Step 4: Update Video Controller**

**Add new method:** `getVideoWatchUrl`

**Location:** `src/controllers/video.controller.ts`

**Implementation:**

```typescript
async getVideoWatchUrl(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // From authentication middleware

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Get video
    const video = await videoService.getVideoById(id);

    // Check if video is published
    if (!video.isPublished) {
      res.status(404).json({
        success: false,
        message: "Video not found",
      });
      return;
    }

    // Check if premium video
    if (video.videoType === "premium") {
      // Check subscription
      const hasSubscription = await subscriptionService.hasActiveSubscription(userId);
      if (!hasSubscription) {
        res.status(403).json({
          success: false,
          message: "Subscription required to watch premium videos",
        });
        return;
      }
    }

    // Generate signed URL (expires in 1 hour)
    if (!video.cloudflareVideoId) {
      res.status(404).json({
        success: false,
        message: "Video file not found",
      });
      return;
    }

    const signedUrl = await r2StorageService.getSignedUrl(
      video.cloudflareVideoId,
      3600 // 1 hour
    );

    // Optional: Increment view count
    await videoService.incrementViewCount(id);

    res.status(200).json({
      success: true,
      data: {
        watchUrl: signedUrl,
        expiresIn: 3600, // seconds
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to generate watch URL",
    });
  }
}
```

---

### **Step 5: Add Route**

**Location:** `src/routes/video.routes.ts`

**Add:**

```typescript
// Get video watch URL (signed URL) - requires authentication
router.get(
  "/:id/watch-url",
  authenticate, // User must be authenticated
  videoController.getVideoWatchUrl.bind(videoController)
);
```

**Note:** This route doesn't need RBAC permission check - it's for app users, not admin.

---

### **Step 6: Create Subscription Service**

**New File:** `src/services/subscription.service.ts`

**Purpose:** Check subscription status

---

### **Step 7: Update Video Service**

**Add method:** `incrementViewCount`

**Purpose:** Track video views

---

## 📋 Database Schema Check

From your schema, I can see:

```prisma
model Subscription {
  status String // 'active' | 'expired' | 'cancelled'
  expiresAt DateTime
  userId String
}
```

**Subscription Check Logic:**

- Status must be `"active"`
- `expiresAt` must be in the future
- User must have at least one active subscription

---

## 🔄 Frontend Changes Needed

### **Current (Public URLs):**

```typescript
<video src={video.cloudflareVideoId} controls />
```

### **New (Signed URLs):**

```typescript
// Fetch watch URL when user clicks play
const getWatchUrl = async (videoId: string) => {
  const response = await api.get(`/api/videos/${videoId}/watch-url`);
  return response.data.data.watchUrl;
};

// Use in video player
const [watchUrl, setWatchUrl] = useState<string | null>(null);

useEffect(() => {
  if (videoId) {
    getWatchUrl(videoId).then(setWatchUrl);
  }
}, [videoId]);

<video src={watchUrl || undefined} controls />;
```

### **Handle URL Expiry (for long videos):**

```typescript
// Refresh signed URL every 50 minutes
useEffect(() => {
  if (!watchUrl) return;

  const interval = setInterval(async () => {
    const newUrl = await getWatchUrl(videoId);
    setWatchUrl(newUrl);
  }, 50 * 60 * 1000); // 50 minutes

  return () => clearInterval(interval);
}, [videoId, watchUrl]);
```

---

## 🔐 Security Features

1. **Authentication Required:** All video access requires valid JWT token
2. **Subscription Check:** Premium videos check for active subscription
3. **Time-Limited URLs:** Signed URLs expire after 1 hour
4. **Published Check:** Only published videos are accessible
5. **View Tracking:** Can track who watches what (analytics)

---

## 📊 Access Matrix

| Video Type   | User Status                        | Access     |
| ------------ | ---------------------------------- | ---------- |
| Premium      | Not authenticated                  | ❌ Denied  |
| Premium      | Authenticated, no subscription     | ❌ Denied  |
| Premium      | Authenticated, active subscription | ✅ Allowed |
| Free/YouTube | Not authenticated                  | ❌ Denied  |
| Free/YouTube | Authenticated                      | ✅ Allowed |

---

## 🚀 Implementation Steps

1. ✅ Create subscription service
2. ✅ Add `getVideoWatchUrl` to video controller
3. ✅ Add route for watch URL endpoint
4. ✅ Update video service to increment view count
5. ✅ Make R2 bucket private
6. ✅ Update frontend to use watch URL endpoint
7. ✅ Add signed URL refresh for long videos
8. ✅ Test with different user types

---

## ❓ Questions

1. **Should we track video views?** (increment `viewCount` when URL is generated)
2. **Signed URL expiry time?** (1 hour recommended, but can be adjusted)
3. **Should thumbnails also be protected?** (or keep them public for preview?)
4. **Error handling:** What message to show if subscription required?

---

**Ready to implement? Let me know and I'll start coding!** 🚀
