# Live Section - Database Requirements Analysis

**Project:** Fitness Dance App  
**Feature:** Live Streaming Classes  
**Date:** [Date]

---

## 📋 Overview

Adding a **Live Section** for live streaming classes requires several database changes. This document outlines all modifications needed.

---

## 🆕 New Tables Required

### 1. **Live Sessions Table** (NEW)

**Purpose:** Store information about scheduled and active live streaming sessions.

**Table: `live_sessions`**

| Column                  | Type      | Constraints           | Description                                    |
| ----------------------- | --------- | --------------------- | ---------------------------------------------- |
| `id`                    | UUID      | PK                    | Live session ID                                |
| `title`                 | TEXT      | NOT NULL              | Session title                                  |
| `description`           | TEXT      |                       | Session description                            |
| `dance_style_id`        | UUID      | FK → dance_styles     | Dance style                                    |
| `intensity_level_id`   | UUID      | FK → intensity_levels | Intensity level                                |
| `instructor_name`       | TEXT      |                       | Instructor/host name                            |
| `instructor_avatar_url` | TEXT      |                       | Instructor profile picture URL                  |
| `scheduled_start_at`    | TIMESTAMP | NOT NULL              | Scheduled start time                           |
| `scheduled_end_at`      | TIMESTAMP |                       | Scheduled end time (estimated)                 |
| `actual_start_at`       | TIMESTAMP |                       | Actual start time (when stream went live)      |
| `actual_end_at`         | TIMESTAMP |                       | Actual end time (when stream ended)             |
| `status`                | TEXT      | DEFAULT 'scheduled'    | 'scheduled', 'live', 'ended', 'cancelled'      |
| `stream_url`            | TEXT      |                       | Live stream URL (Cloudflare Stream)            |
| `stream_key`            | TEXT      |                       | Stream key for broadcasting (secure)           |
| `cloudflare_stream_id`  | TEXT      | UNIQUE                | Cloudflare Stream live stream ID               |
| `thumbnail_url`         | TEXT      |                       | Thumbnail/preview image                        |
| `max_participants`     | INTEGER   |                       | Maximum participants (null = unlimited)        |
| `current_participants`  | INTEGER   | DEFAULT 0             | Current number of viewers                      |
| `is_recorded`           | BOOLEAN   | DEFAULT false         | Whether session will be recorded               |
| `recorded_video_id`     | UUID      | FK → videos (nullable) | Link to recorded video (if saved)            |
| `view_count`            | INTEGER   | DEFAULT 0             | Total views (live + replay)                   |
| `is_published`          | BOOLEAN   | DEFAULT false         | Published status (visible to users)           |
| `created_by`            | UUID      | FK → admins           | Admin who created the session                  |
| `created_at`            | TIMESTAMP | DEFAULT NOW()         | Creation date                                  |
| `updated_at`            | TIMESTAMP | DEFAULT NOW()         | Last update date                               |
| `deleted_at`            | TIMESTAMP |                       | Soft delete timestamp                          |

**Indexes:**

- `idx_live_sessions_dance_style_id` on `dance_style_id`
- `idx_live_sessions_intensity_level_id` on `intensity_level_id`
- `idx_live_sessions_status` on `status`
- `idx_live_sessions_scheduled_start_at` on `scheduled_start_at`
- `idx_live_sessions_is_published` on `is_published`
- `idx_live_sessions_created_by` on `created_by`
- Composite index on `(status, scheduled_start_at)` for upcoming live sessions
- Composite index on `(is_published, status, scheduled_start_at)` for public queries

**Business Rules:**

- `status` transitions: `scheduled` → `live` → `ended` (or `cancelled`)
- `actual_start_at` is set when status changes to `live`
- `actual_end_at` is set when status changes to `ended`
- `recorded_video_id` is set after recording is processed and saved to `videos` table
- `max_participants` can be null (unlimited) or a specific number
- `current_participants` is updated in real-time during live session

---

### 2. **Live Attendance Table** (NEW)

**Purpose:** Track which users are watching/attended live sessions.

**Table: `live_attendance`**

| Column            | Type      | Constraints        | Description                                    |
| ----------------- | --------- | ------------------ | ---------------------------------------------- |
| `id`              | UUID      | PK                 | Attendance ID                                  |
| `user_id`         | UUID      | FK → users         | User ID                                        |
| `live_session_id` | UUID      | FK → live_sessions | Live session ID                                |
| `joined_at`       | TIMESTAMP | DEFAULT NOW()      | When user joined the live session              |
| `left_at`         | TIMESTAMP |                    | When user left the live session                |
| `watch_duration`  | INTEGER   | DEFAULT 0          | Total seconds watched (in real-time)           |
| `completed`       | BOOLEAN   | DEFAULT false      | Whether user watched until the end             |
| `created_at`      | TIMESTAMP | DEFAULT NOW()      | Creation date                                  |
| `updated_at`      | TIMESTAMP | DEFAULT NOW()      | Last update date                               |

**Indexes:**

- `idx_live_attendance_user_id` on `user_id`
- `idx_live_attendance_live_session_id` on `live_session_id`
- `idx_live_attendance_joined_at` on `joined_at`
- Composite unique index on `(user_id, live_session_id)` - one record per user per session

**Business Rules:**

- One attendance record per user per live session
- `joined_at` is set when user enters the live stream
- `left_at` is set when user exits (can be updated multiple times if user rejoins)
- `watch_duration` is updated periodically while user is watching
- `completed` is set to `true` if user watched until `actual_end_at`

---

## 🔄 Modifications to Existing Tables

### 1. **Videos Table** - Add Live Session Link

**New Field:**

| Column              | Type      | Constraints            | Description                                    |
| ------------------- | --------- | ---------------------- | ---------------------------------------------- |
| `live_session_id`  | UUID      | FK → live_sessions (nullable) | Link to original live session (if this is a recording) |

**Changes:**

- Add `live_session_id` column (nullable)
- Add index: `idx_videos_live_session_id` on `live_session_id`
- Add foreign key constraint to `live_sessions.id`

**Purpose:** Link recorded videos back to their original live session.

---

### 2. **Notifications Table** - Already Supports Live

**Current Structure:** ✅ Already supports different notification types

**No Changes Needed** - Just use `type = 'live'` for live session notifications.

**Example Notification Types:**
- `'live'` - Upcoming live session
- `'live_started'` - Live session just started
- `'live_reminder'` - Reminder before live session

---

### 3. **Watch History Table** - Distinguish Live vs Recorded

**Optional Enhancement:**

| Column          | Type      | Constraints | Description                                    |
| --------------- | --------- | ----------- | ---------------------------------------------- |
| `source_type`  | TEXT      | DEFAULT 'video' | 'video' (pre-recorded) or 'live' (live session) |
| `live_session_id` | UUID   | FK → live_sessions (nullable) | Link to live session if watched live |

**Note:** This is **optional** - you can track live attendance separately in `live_attendance` table instead.

---

## 📊 Updated Entity Relationship Diagram

```
┌─────────────┐
│ LiveSessions│
└─────────────┘
      │
      ├─────────────────┐
      │                 │
      ▼                 ▼
┌─────────────┐   ┌──────────────┐
│   Videos    │   │LiveAttendance│
│(recordings) │   │              │
└─────────────┘   └──────────────┘
      │                 │
      │                 │
      ▼                 ▼
┌─────────────┐   ┌─────────────┐
│DanceStyles  │   │    Users     │
└─────────────┘   └─────────────┘
```

---

## 🔧 Prisma Schema Updates

### New Models

```prisma
// ============================================
// LIVE STREAMING
// ============================================

model LiveSession {
  id                  String    @id @default(uuid())
  title               String
  description         String?
  danceStyleId        String    @map("dance_style_id")
  intensityLevelId    String    @map("intensity_level_id")
  instructorName      String?   @map("instructor_name")
  instructorAvatarUrl String?   @map("instructor_avatar_url")
  scheduledStartAt    DateTime  @map("scheduled_start_at")
  scheduledEndAt      DateTime? @map("scheduled_end_at")
  actualStartAt       DateTime? @map("actual_start_at")
  actualEndAt         DateTime? @map("actual_end_at")
  status              String    @default("scheduled") // 'scheduled' | 'live' | 'ended' | 'cancelled'
  streamUrl           String?   @map("stream_url")
  streamKey           String?   @map("stream_key") // Encrypted/secure
  cloudflareStreamId  String?   @unique @map("cloudflare_stream_id")
  thumbnailUrl        String?   @map("thumbnail_url")
  maxParticipants     Int?      @map("max_participants")
  currentParticipants Int      @default(0) @map("current_participants")
  isRecorded          Boolean   @default(false) @map("is_recorded")
  recordedVideoId     String?   @map("recorded_video_id")
  viewCount           Int       @default(0) @map("view_count")
  isPublished         Boolean   @default(false) @map("is_published")
  createdById         String    @map("created_by")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")
  deletedAt           DateTime? @map("deleted_at")

  // Relations
  danceStyle      DanceStyle      @relation(fields: [danceStyleId], references: [id])
  intensityLevel  IntensityLevel  @relation(fields: [intensityLevelId], references: [id])
  createdBy       Admin           @relation(fields: [createdById], references: [id])
  recordedVideo   Video?          @relation(fields: [recordedVideoId], references: [id])
  attendance      LiveAttendance[]

  @@index([danceStyleId])
  @@index([intensityLevelId])
  @@index([status])
  @@index([scheduledStartAt])
  @@index([isPublished])
  @@index([createdById])
  @@index([status, scheduledStartAt])
  @@index([isPublished, status, scheduledStartAt])
  @@map("live_sessions")
}

model LiveAttendance {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  liveSessionId String   @map("live_session_id")
  joinedAt      DateTime @default(now()) @map("joined_at")
  leftAt        DateTime? @map("left_at")
  watchDuration Int      @default(0) @map("watch_duration")
  completed     Boolean  @default(false)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  user        User        @relation(fields: [userId], references: [id])
  liveSession LiveSession @relation(fields: [liveSessionId], references: [id])

  @@unique([userId, liveSessionId])
  @@index([userId])
  @@index([liveSessionId])
  @@index([joinedAt])
  @@map("live_attendance")
}
```

### Updated Models

```prisma
// Update Video model
model Video {
  // ... existing fields ...
  liveSessionId String?  @map("live_session_id")
  
  // Relations
  liveSession LiveSession? @relation(fields: [liveSessionId], references: [id])
  
  // ... rest of model ...
  @@index([liveSessionId])
}

// Update DanceStyle model
model DanceStyle {
  // ... existing relations ...
  liveSessions LiveSession[]
}

// Update IntensityLevel model
model IntensityLevel {
  // ... existing relations ...
  liveSessions LiveSession[]
}

// Update Admin model
model Admin {
  // ... existing relations ...
  createdLiveSessions LiveSession[]
}

// Update User model
model User {
  // ... existing relations ...
  liveAttendance LiveAttendance[]
}
```

---

## 📝 Summary of Changes

### ✅ New Tables (2)

1. **`live_sessions`** - Main table for live streaming sessions
2. **`live_attendance`** - Track user attendance in live sessions

### ✅ Modified Tables (1)

1. **`videos`** - Add `live_session_id` to link recordings

### ✅ No Changes Needed (1)

1. **`notifications`** - Already supports live notifications via `type` field

### ✅ Optional Enhancements

1. **`watch_history`** - Add `source_type` and `live_session_id` (optional)

---

## 🎯 Implementation Priority

### Phase 1: Core Live Features (MVP)

1. ✅ Create `live_sessions` table
2. ✅ Create `live_attendance` table
3. ✅ Add `live_session_id` to `videos` table
4. ✅ Update Prisma schema
5. ✅ Create migrations

### Phase 2: Enhanced Features

1. ⚠️ Add `source_type` to `watch_history` (optional)
2. ⚠️ Add live chat table (if needed)
3. ⚠️ Add live session analytics

---

## 💡 Additional Considerations

### 1. **Live Chat** (Optional)

If you want live chat during sessions, add:

**Table: `live_chat_messages`**

| Column          | Type      | Constraints        | Description        |
| --------------- | --------- | ------------------ | ------------------ |
| `id`            | UUID      | PK                 | Message ID         |
| `live_session_id` | UUID   | FK → live_sessions | Live session ID    |
| `user_id`       | UUID      | FK → users         | User ID            |
| `message`       | TEXT      | NOT NULL           | Chat message       |
| `created_at`    | TIMESTAMP | DEFAULT NOW()      | Message timestamp  |

**Note:** Consider using a real-time service (WebSockets, Pusher, Ably) for live chat instead of polling the database.

---

### 2. **Instructors Table** (Optional)

If you want to manage instructors separately:

**Table: `instructors`**

| Column          | Type      | Constraints | Description        |
| --------------- | --------- | ----------- | ------------------ |
| `id`            | UUID      | PK          | Instructor ID      |
| `name`          | TEXT      | NOT NULL    | Instructor name    |
| `bio`           | TEXT      |             | Biography          |
| `avatar_url`    | TEXT      |             | Profile picture    |
| `specialties`   | TEXT[]    |             | Dance styles       |
| `is_active`     | BOOLEAN   | DEFAULT true | Active status    |

Then link `live_sessions.instructor_id` → `instructors.id`

---

### 3. **Cloudflare Stream Integration**

**Live Streaming Setup:**

- Use Cloudflare Stream Live API
- Generate `stream_key` and `stream_url` when creating live session
- Store `cloudflare_stream_id` for API calls
- Update `status` based on stream events (webhooks)

**Recording:**

- After live ends, Cloudflare can auto-record
- Process recording and create `Video` record
- Link via `live_sessions.recorded_video_id` and `videos.live_session_id`

---

## 🚀 Next Steps

1. **Review this document** with your team
2. **Decide on optional features** (live chat, instructors table, etc.)
3. **Create Prisma schema updates**
4. **Run migrations**
5. **Update API endpoints** for live sessions
6. **Update admin panel** for live session management
7. **Update mobile app** for live streaming UI

---

## 📊 Estimated Impact

### Database Changes

- **New Tables:** 2 (required) + 1-2 (optional)
- **Modified Tables:** 1 (videos)
- **New Indexes:** ~10-12
- **Migration Complexity:** Medium

### API Changes

- **New Endpoints:** ~8-10 for live sessions
- **Modified Endpoints:** Video endpoints (for recordings)

### Frontend Changes

- **New Screens:** Live schedule, Live player, Live attendance
- **Modified Screens:** Video player (for recordings)

---

**Total Estimated Work:** 2-3 weeks for full implementation

