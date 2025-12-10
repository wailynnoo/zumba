# Live Section - Technology Requirements

**Project:** Fitness Dance App  
**Feature:** Live Streaming Classes  
**Date:** [Date]

---

## 📋 Overview

This document outlines all technology requirements, tools, and services needed to implement live streaming functionality in your fitness dance app.

---

## ✅ Good News: Your Current Stack Supports Live!

**Current Tech Stack:**

- ✅ **Cloudflare Stream** - Already supports live streaming!
- ✅ **React Native** - Can handle live video playback
- ✅ **Node.js + Express** - Can handle live session APIs
- ✅ **PostgreSQL** - Can store live session data

**No major tech stack changes needed!** Just additions and configurations.

---

## 🎯 Technology Requirements Breakdown

### 1. **Live Streaming Service** ✅ Already Chosen

**Current:** Cloudflare Stream  
**Status:** ✅ Supports live streaming

**What You Need:**

#### A. Cloudflare Stream Live API

**Features:**

- ✅ Live streaming support
- ✅ Automatic recording (optional)
- ✅ Low latency streaming
- ✅ Global CDN
- ✅ Signed URLs for security
- ✅ Webhooks for status updates

**API Endpoints Needed:**

```javascript
// Create live stream
POST https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/live_inputs

// Get stream status
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/live_inputs/{input_id}

// Get stream playback URL
GET https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/live_inputs/{input_id}/outputs
```

**Required Packages:**

```json
{
  "dependencies": {
    "cloudflare": "^3.0.0" // Cloudflare API client
  }
}
```

**Backend Integration:**

```typescript
// services/cloudflareStreamService.ts
import { Cloudflare } from "cloudflare";

const cloudflare = new Cloudflare({
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
});

// Create live stream
export async function createLiveStream(title: string) {
  const response = await cloudflare.stream.liveInputs.create({
    meta: { name: title },
    recording: {
      mode: "automatic", // Auto-record after stream ends
      requireSignedURLs: true,
    },
  });

  return {
    streamId: response.id,
    streamKey: response.rtmps?.streamKey,
    streamUrl: response.rtmps?.url,
    playbackUrl: response.playback?.hls,
  };
}
```

---

### 2. **Mobile App - Live Video Player** ✅ Compatible

**Current:** React Native  
**Status:** ✅ Can handle live streaming

**Required Packages:**

```json
{
  "dependencies": {
    "react-native-video": "^6.0.0", // Already using for videos
    "@react-native-community/netinfo": "^11.0.0" // Network status
  }
}
```

**Live Video Player Component:**

```typescript
// components/LiveVideoPlayer.tsx
import Video from "react-native-video";
import { View, Text, StyleSheet } from "react-native";

interface LiveVideoPlayerProps {
  streamUrl: string;
  isLive: boolean;
  onError?: (error: any) => void;
}

export function LiveVideoPlayer({
  streamUrl,
  isLive,
  onError,
}: LiveVideoPlayerProps) {
  return (
    <View style={styles.container}>
      {isLive && (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}
      <Video
        source={{ uri: streamUrl }}
        style={styles.video}
        controls={true}
        resizeMode="contain"
        onError={onError}
        bufferConfig={{
          minBufferMs: 15000,
          maxBufferMs: 50000,
          bufferForPlaybackMs: 2500,
          bufferForPlaybackAfterRebufferMs: 5000,
        }}
      />
    </View>
  );
}
```

**HLS Support:**

- ✅ React Native Video supports HLS (HTTP Live Streaming)
- ✅ Cloudflare Stream provides HLS URLs
- ✅ Works on both iOS and Android

---

### 3. **Backend API - Live Session Management** ✅ Ready

**Current:** Node.js + Express + TypeScript  
**Status:** ✅ Can handle live session APIs

**Required Packages:**

```json
{
  "dependencies": {
    "cloudflare": "^3.0.0",
    "node-cron": "^3.0.0", // For scheduled tasks
    "ws": "^8.14.0" // WebSockets (optional, for real-time updates)
  }
}
```

**API Endpoints to Add:**

```typescript
// routes/liveSessions.ts

// Member API
GET    /api/live-sessions              // List upcoming/active live sessions
GET    /api/live-sessions/:id           // Get live session details
GET    /api/live-sessions/:id/stream    // Get stream URL (signed)
POST   /api/live-sessions/:id/join    // Join live session (track attendance)
POST   /api/live-sessions/:id/leave   // Leave live session

// Admin API
GET    /api/admin/live-sessions        // List all live sessions
POST   /api/admin/live-sessions        // Create live session
PUT    /api/admin/live-sessions/:id    // Update live session
DELETE /api/admin/live-sessions/:id    // Cancel live session
POST   /api/admin/live-sessions/:id/start  // Start live stream
POST   /api/admin/live-sessions/:id/stop  // Stop live stream
GET    /api/admin/live-sessions/:id/attendance  // Get attendance stats
```

**Webhook Handler (for Cloudflare Stream events):**

```typescript
// routes/webhooks.ts
POST / api / webhooks / cloudflare - stream;

// Handle events:
// - stream.started
// - stream.ended
// - recording.ready
```

---

### 4. **Real-Time Updates** ⚠️ Optional but Recommended

**Options:**

#### Option A: Polling (Simple, No Extra Tech)

**How it works:**

- Mobile app polls API every 5-10 seconds
- Check for status updates, participant count, etc.

**Pros:**

- ✅ Simple to implement
- ✅ No additional services
- ✅ Works with existing stack

**Cons:**

- ⚠️ Higher API load
- ⚠️ Slight delay in updates

**Implementation:**

```typescript
// Mobile app polling
useEffect(() => {
  const interval = setInterval(async () => {
    const session = await fetchLiveSession(sessionId);
    setSession(session);
  }, 5000); // Poll every 5 seconds

  return () => clearInterval(interval);
}, [sessionId]);
```

---

#### Option B: WebSockets (Real-Time, Better UX)

**Service Options:**

1. **Socket.io** (Recommended)

   - ✅ Easy to implement
   - ✅ Works with Node.js
   - ✅ Auto-reconnection
   - ✅ Room-based messaging

2. **Pusher** (Third-party service)

   - ✅ Managed service
   - ✅ Easy setup
   - ⚠️ Additional cost (~$49/month)

3. **Ably** (Third-party service)
   - ✅ Managed service
   - ✅ Good free tier
   - ⚠️ Additional cost for scale

**Socket.io Implementation:**

```json
{
  "dependencies": {
    "socket.io": "^4.6.0",
    "socket.io-client": "^4.6.0"
  }
}
```

**Backend:**

```typescript
// server.ts
import { Server } from "socket.io";

const io = new Server(server, {
  cors: { origin: "*" }, // Configure properly for production
});

io.on("connection", (socket) => {
  socket.on("join-live-session", (sessionId) => {
    socket.join(`live-session-${sessionId}`);
  });

  socket.on("leave-live-session", (sessionId) => {
    socket.leave(`live-session-${sessionId}`);
  });
});

// Broadcast updates
io.to(`live-session-${sessionId}`).emit("session-update", {
  status: "live",
  participantCount: count,
});
```

**Mobile App:**

```typescript
// Mobile app
import io from "socket.io-client";

const socket = io("https://api-member.zfitdance.com");

socket.on("connect", () => {
  socket.emit("join-live-session", sessionId);
});

socket.on("session-update", (data) => {
  // Update UI with real-time data
  setSession(data);
});
```

**Recommendation:** Start with **polling** (Option A), upgrade to **Socket.io** (Option B) later if needed.

---

### 5. **Broadcasting Software** (For Instructors)

**Instructors need software to broadcast:**

#### Option A: OBS Studio (Free, Recommended)

**Features:**

- ✅ Free and open-source
- ✅ Works on Windows, Mac, Linux
- ✅ Professional features
- ✅ Supports RTMP streaming

**Setup:**

1. Download OBS Studio
2. Configure Cloudflare Stream RTMP URL
3. Add stream key
4. Start streaming

**Cost:** Free

---

#### Option B: Cloudflare Stream Studio (Web-based)

**Features:**

- ✅ Browser-based (no download)
- ✅ Simple interface
- ✅ Built by Cloudflare

**Limitations:**

- ⚠️ Limited features compared to OBS
- ⚠️ Browser-based (may have limitations)

**Cost:** Free (with Cloudflare Stream)

---

#### Option C: Mobile Broadcasting Apps

**For mobile broadcasting:**

1. **Larix Broadcaster** (iOS/Android)

   - ✅ Free
   - ✅ Professional features
   - ✅ RTMP support

2. **Streamlabs Mobile** (iOS/Android)
   - ✅ Free
   - ✅ Easy to use
   - ✅ Built-in features

**Recommendation:** **OBS Studio** for desktop, **Larix Broadcaster** for mobile.

---

### 6. **Push Notifications** ✅ Already Set Up

**Current:** Firebase Cloud Messaging + APNs  
**Status:** ✅ Ready for live notifications

**No changes needed!** Just add new notification types:

```typescript
// Notification types for live sessions
{
  type: 'live_upcoming',      // Live session starting soon
  type: 'live_started',        // Live session just started
  type: 'live_reminder',       // Reminder before live
}
```

---

### 7. **Database** ✅ Ready

**Current:** PostgreSQL (Railway - Production, Local - Development)  
**Status:** ✅ Ready (see Live_Section_Database_Requirements.md)

**No additional tech needed!** Just schema updates.

---

### 8. **CDN & Performance** ✅ Already Using

**Current:** Cloudflare Free CDN  
**Status:** ✅ Live streams use Cloudflare CDN automatically

**No changes needed!** Cloudflare Stream includes CDN.

---

## 📦 Complete Package List

### Backend (Node.js)

```json
{
  "dependencies": {
    "cloudflare": "^3.0.0", // Cloudflare API client
    "node-cron": "^3.0.0", // Scheduled tasks (optional)
    "socket.io": "^4.6.0", // WebSockets (optional)
    "ws": "^8.14.0" // WebSocket server (optional)
  }
}
```

### Mobile App (React Native)

```json
{
  "dependencies": {
    "react-native-video": "^6.0.0", // Already installed
    "@react-native-community/netinfo": "^11.0.0", // Network status
    "socket.io-client": "^4.6.0" // WebSockets (optional)
  }
}
```

### Admin Panel (Next.js)

```json
{
  "dependencies": {
    "socket.io-client": "^4.6.0" // Real-time updates (optional)
  }
}
```

---

## 🔧 Implementation Steps

### Phase 1: Basic Live Streaming (MVP)

**Week 1-2: Backend Setup**

1. ✅ Install Cloudflare API client
2. ✅ Create live session API endpoints
3. ✅ Integrate Cloudflare Stream Live API
4. ✅ Add database migrations
5. ✅ Create webhook handler

**Week 3: Mobile App**

1. ✅ Update video player for live streams
2. ✅ Create live session list screen
3. ✅ Add live session detail screen
4. ✅ Implement live video player
5. ✅ Add attendance tracking

**Week 4: Admin Panel**

1. ✅ Create live session management UI
2. ✅ Add create/edit live session forms
3. ✅ Add live session status dashboard
4. ✅ Add attendance analytics

**Total:** ~4 weeks for MVP

---

### Phase 2: Enhanced Features

**Week 5-6: Real-Time Updates**

1. ⚠️ Add Socket.io for real-time updates
2. ⚠️ Real-time participant count
3. ⚠️ Live status updates
4. ⚠️ Live chat (optional)

**Week 7: Recording & Playback**

1. ⚠️ Auto-record live sessions
2. ⚠️ Save recordings as videos
3. ⚠️ Link recordings to live sessions
4. ⚠️ Playback recorded sessions

**Total:** ~2-3 additional weeks

---

## 💰 Cost Analysis

### Current Costs (No Change)

- ✅ Cloudflare Stream: Already paying for video hosting
- ✅ Backend hosting (Railway): No change
- ✅ Database (Railway PostgreSQL): No change
- ✅ Push notifications (Firebase): No change

### Additional Costs (If Needed)

#### Option 1: Polling (No Extra Cost)

- **Cost:** $0/month
- **Method:** API polling every 5-10 seconds

#### Option 2: Socket.io (Minimal Cost)

- **Cost:** $0/month (self-hosted)
- **Method:** WebSocket server on Railway
- **Note:** Uses existing Railway hosting

#### Option 3: Pusher (Managed Service)

- **Cost:** ~$49/month (Starter plan)
- **Method:** Managed WebSocket service
- **Note:** Only if you want managed service

#### Option 4: Ably (Managed Service)

- **Cost:** Free tier (200K messages/month)
- **Method:** Managed WebSocket service
- **Note:** Good for starting, upgrade later

**Recommendation:** Start with **polling** ($0), upgrade to **Socket.io** ($0) if needed.

---

## 🎯 Technology Summary

### ✅ What You Already Have

| Component              | Technology        | Status   |
| ---------------------- | ----------------- | -------- |
| Live Streaming Service | Cloudflare Stream | ✅ Ready |
| Mobile App Framework   | React Native      | ✅ Ready |
| Backend Framework      | Node.js + Express | ✅ Ready |
| Database               | PostgreSQL        | ✅ Ready |
| Push Notifications     | FCM + APNs        | ✅ Ready |
| CDN                    | Cloudflare        | ✅ Ready |

### ➕ What You Need to Add

| Component             | Technology                        | Priority    | Cost |
| --------------------- | --------------------------------- | ----------- | ---- |
| Cloudflare API Client | `cloudflare` npm package          | Required    | Free |
| Real-Time Updates     | Socket.io (optional)              | Optional    | Free |
| Broadcasting Software | OBS Studio                        | Required    | Free |
| Network Status        | `@react-native-community/netinfo` | Recommended | Free |

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
# Install Cloudflare API client
npm install cloudflare

# Create live session service
# services/cloudflareStreamService.ts
```

### 2. Mobile App Setup

```bash
# Already have react-native-video
# Just update video player for live streams
```

### 3. Admin Panel Setup

```bash
# Add live session management UI
# pages/admin/live-sessions
```

---

## 📊 Technology Comparison

### Live Streaming Services

| Service               | Cost        | Latency  | Setup  | Recommendation        |
| --------------------- | ----------- | -------- | ------ | --------------------- |
| **Cloudflare Stream** | $1/1000 min | Low      | Easy   | ✅ Already using      |
| AWS IVS               | $0.50/hour  | Very Low | Medium | ⚠️ More complex       |
| Mux Live              | $0.01/min   | Low      | Easy   | ⚠️ Additional service |
| Twitch                | Free        | Low      | Easy   | ⚠️ Not for business   |

**Recommendation:** Stick with **Cloudflare Stream** (already chosen).

---

### Real-Time Update Methods

| Method        | Cost      | Latency | Complexity | Recommendation         |
| ------------- | --------- | ------- | ---------- | ---------------------- |
| **Polling**   | $0        | 5-10s   | Easy       | ✅ Start here          |
| **Socket.io** | $0        | <1s     | Medium     | ✅ Upgrade later       |
| **Pusher**    | $49/mo    | <1s     | Easy       | ⚠️ If you want managed |
| **Ably**      | Free tier | <1s     | Easy       | ⚠️ Good for starting   |

**Recommendation:** Start with **polling**, upgrade to **Socket.io** if needed.

---

## ✅ Final Recommendations

### Must Have (MVP)

1. ✅ **Cloudflare Stream Live API** - Already have
2. ✅ **Cloudflare npm package** - Install this
3. ✅ **react-native-video** - Already have
4. ✅ **OBS Studio** - For instructors to broadcast

### Should Have (Better UX)

1. ⚠️ **Socket.io** - Real-time updates
2. ⚠️ **Network status detection** - Better error handling

### Nice to Have (Future)

1. ⚠️ **Live chat** - User engagement
2. ⚠️ **Live reactions** - Emoji reactions
3. ⚠️ **Live Q&A** - Interactive sessions

---

## 🎯 Summary

**Good News:** Your current tech stack already supports live streaming! You just need to:

1. ✅ Install Cloudflare API client
2. ✅ Add live session API endpoints
3. ✅ Update mobile app video player
4. ✅ Add admin panel for live session management

**No major technology changes needed!** Just additions and configurations.

**Estimated Implementation Time:** 3-4 weeks for MVP

**Additional Cost:** $0 (if using polling) or $0 (if using Socket.io)

---

## 📚 Resources

### Documentation

- [Cloudflare Stream Live API](https://developers.cloudflare.com/stream/stream-live/)
- [React Native Video](https://github.com/react-native-video/react-native-video)
- [Socket.io Guide](https://socket.io/docs/v4/)
- [OBS Studio Setup](https://obsproject.com/)

### Tutorials

- Cloudflare Stream Live Setup
- React Native Live Video Player
- Socket.io Real-Time Updates

---

**Ready to implement?** Start with the backend API endpoints, then mobile app, then admin panel!
