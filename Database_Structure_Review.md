# Database Structure Review & Missing Elements

**Project:** Fitness Dance App  
**Date:** [Date]

---

## ✅ Current Database Tables (23 tables)

1. ✅ Users (Members)
2. ✅ Admin Roles
3. ✅ Admins
4. ✅ Dance Styles
5. ✅ Intensity Levels
6. ✅ Video Categories
7. ✅ Video Subcategories
8. ✅ Videos
9. ✅ Subscription Plans
10. ✅ Subscriptions
11. ✅ Payments
12. ✅ Playlists
13. ✅ Playlist Items
14. ✅ Ratings
15. ✅ Feedback
16. ✅ Knowledge Articles
17. ✅ Watch History
18. ✅ Favorites
19. ✅ Notifications
20. ✅ Refresh Tokens
21. ✅ OAuth Providers
22. ✅ System Settings
23. ✅ File Uploads
24. ✅ Audit Logs
25. ✅ Search History

---

## 🔍 Missing Elements Analysis

### 1. **JWT Refresh Tokens** ⚠️ MISSING

**Issue:** JWT authentication requires refresh tokens for security.

**What's Missing:**

- Table to store refresh tokens
- Token expiration tracking
- Token revocation support

**Recommended Table: `refresh_tokens`**

| Column        | Type      | Constraints      | Description                    |
| ------------- | --------- | ---------------- | ------------------------------ |
| `id`          | UUID      | PK               | Token ID                       |
| `user_id`     | UUID      | FK → users       | User ID                        |
| `token`       | TEXT      | UNIQUE, NOT NULL | Refresh token (hashed)         |
| `expires_at`  | TIMESTAMP | NOT NULL         | Token expiration date          |
| `is_revoked`  | BOOLEAN   | DEFAULT false    | Whether token is revoked       |
| `revoked_at`  | TIMESTAMP |                  | Revocation timestamp           |
| `device_info` | TEXT      |                  | Device/browser info (optional) |
| `ip_address`  | TEXT      |                  | IP address (optional)          |
| `created_at`  | TIMESTAMP | DEFAULT NOW()    | Creation date                  |

**Why Needed:**

- Secure token refresh mechanism
- Ability to revoke tokens
- Track active sessions
- Security audit trail

---

### 2. **Password Reset Tokens** ⚠️ MISSING

**Issue:** Password reset functionality needs token storage.

**What's Missing:**

- Password reset token field in users table OR separate table
- Token expiration tracking

**Option A: Add to Users Table (Simpler)**

Add to `users` table:

- `password_reset_token` (TEXT, nullable)
- `password_reset_expires_at` (TIMESTAMP, nullable)

**Option B: Separate Table (Better for Audit)**

Create `password_reset_tokens` table:

- `id`, `user_id`, `token`, `expires_at`, `used_at`, `created_at`

**Recommendation:** Option A (simpler, sufficient for MVP)

---

### 3. **OAuth/Social Login Tokens** ⚠️ MISSING

**Issue:** Social login (Google, Apple) requires OAuth token storage.

**What's Missing:**

- Table to store OAuth provider tokens
- Link social accounts to users

**Recommended Table: `user_oauth_providers`**

| Column             | Type      | Constraints   | Description                     |
| ------------------ | --------- | ------------- | ------------------------------- |
| `id`               | UUID      | PK            | OAuth ID                        |
| `user_id`          | UUID      | FK → users    | User ID                         |
| `provider`         | TEXT      | NOT NULL      | 'google', 'apple'               |
| `provider_id`      | TEXT      | NOT NULL      | Provider user ID                |
| `email`            | TEXT      |               | Email from provider             |
| `access_token`     | TEXT      |               | OAuth access token (encrypted)  |
| `refresh_token`    | TEXT      |               | OAuth refresh token (encrypted) |
| `token_expires_at` | TIMESTAMP |               | Token expiration                |
| `created_at`       | TIMESTAMP | DEFAULT NOW() | Creation date                   |
| `updated_at`       | TIMESTAMP | DEFAULT NOW() | Last update date                |

**Indexes:**

- Unique on `(provider, provider_id)`
- Index on `user_id`

**Why Needed:**

- Link social accounts to users
- Store OAuth tokens for API calls
- Support multiple social logins per user

---

### 4. **System Settings** ⚠️ MISSING

**Issue:** Admin panel needs system configuration storage.

**What's Missing:**

- Table to store app settings
- Configuration key-value pairs

**Recommended Table: `system_settings`**

| Column        | Type      | Constraints      | Description                           |
| ------------- | --------- | ---------------- | ------------------------------------- |
| `id`          | UUID      | PK               | Setting ID                            |
| `key`         | TEXT      | UNIQUE, NOT NULL | Setting key (e.g., 'app_name')        |
| `value`       | TEXT      |                  | Setting value (JSON if needed)        |
| `type`        | TEXT      | DEFAULT 'string' | 'string', 'number', 'boolean', 'json' |
| `category`    | TEXT      |                  | 'general', 'payment', 'email', etc.   |
| `description` | TEXT      |                  | Setting description                   |
| `created_at`  | TIMESTAMP | DEFAULT NOW()    | Creation date                         |
| `updated_at`  | TIMESTAMP | DEFAULT NOW()    | Last update date                      |

**Example Settings:**

- `app_name`: "ZFit Dance"
- `free_trial_days`: 4
- `mmqr_enabled`: true
- `email_from_address`: "noreply@zfitdance.com"
- `max_video_upload_size_mb`: 2048

**Why Needed:**

- Store app configuration
- Admin can change settings without code changes
- Support different environments (dev, staging, prod)

---

### 5. **File Uploads Tracking** ⚠️ OPTIONAL

**Issue:** Track uploaded files (videos, images, thumbnails).

**What's Missing:**

- Table to track file uploads
- File metadata storage

**Recommended Table: `file_uploads`**

| Column          | Type      | Constraints            | Description                                    |
| --------------- | --------- | ---------------------- | ---------------------------------------------- |
| `id`            | UUID      | PK                     | File ID                                        |
| `user_id`       | UUID      | FK → users (nullable)  | Uploader (if user upload)                      |
| `admin_id`      | UUID      | FK → admins (nullable) | Uploader (if admin upload)                     |
| `file_type`     | TEXT      | NOT NULL               | 'video', 'image', 'audio', etc.                |
| `file_name`     | TEXT      | NOT NULL               | Original file name                             |
| `file_size`     | BIGINT    |                        | File size in bytes                             |
| `mime_type`     | TEXT      |                        | MIME type                                      |
| `storage_url`   | TEXT      | NOT NULL               | Storage URL (Cloudflare R2/Supabase Storage)   |
| `storage_key`   | TEXT      |                        | Storage key/path                               |
| `upload_status` | TEXT      | DEFAULT 'pending'      | 'pending', 'processing', 'completed', 'failed' |
| `metadata`      | JSONB     |                        | Additional metadata                            |
| `created_at`    | TIMESTAMP | DEFAULT NOW()          | Creation date                                  |
| `updated_at`    | TIMESTAMP | DEFAULT NOW()          | Last update date                               |

**Why Needed:**

- Track all file uploads
- Monitor storage usage
- Handle upload failures
- Clean up orphaned files

**Note:** Optional - can be added later if needed

---

### 6. **Audit Log** ⚠️ OPTIONAL

**Issue:** Track important actions for security and debugging.

**What's Missing:**

- Table to log admin actions
- User action tracking

**Recommended Table: `audit_logs`**

| Column        | Type      | Constraints            | Description                         |
| ------------- | --------- | ---------------------- | ----------------------------------- |
| `id`          | UUID      | PK                     | Log ID                              |
| `user_id`     | UUID      | FK → users (nullable)  | User who performed action           |
| `admin_id`    | UUID      | FK → admins (nullable) | Admin who performed action          |
| `action`      | TEXT      | NOT NULL               | Action type (e.g., 'video.created') |
| `entity_type` | TEXT      |                        | Entity type ('video', 'user', etc.) |
| `entity_id`   | UUID      |                        | Entity ID                           |
| `changes`     | JSONB     |                        | What changed (before/after)         |
| `ip_address`  | TEXT      |                        | IP address                          |
| `user_agent`  | TEXT      |                        | User agent/browser                  |
| `created_at`  | TIMESTAMP | DEFAULT NOW()          | Creation date                       |

**Why Needed:**

- Security audit trail
- Debug issues
- Compliance requirements
- Track admin actions

**Note:** Optional - can be added later if needed

---

### 7. **Search History** ⚠️ OPTIONAL

**Issue:** Track user searches for analytics and recommendations.

**What's Missing:**

- Table to store search queries

**Recommended Table: `search_history`**

| Column          | Type      | Constraints           | Description                  |
| --------------- | --------- | --------------------- | ---------------------------- |
| `id`            | UUID      | PK                    | Search ID                    |
| `user_id`       | UUID      | FK → users (nullable) | User ID (null for anonymous) |
| `query`         | TEXT      | NOT NULL              | Search query                 |
| `results_count` | INTEGER   | DEFAULT 0             | Number of results            |
| `created_at`    | TIMESTAMP | DEFAULT NOW()         | Creation date                |

**Why Needed:**

- Analytics
- Popular searches
- Search suggestions
- User behavior tracking

**Note:** Optional - can be added in Phase 2

---

### 8. **User Preferences** ⚠️ OPTIONAL

**Issue:** Store user preferences beyond what's in users table.

**What's Missing:**

- Extended user preferences

**Option A: Add JSONB field to users table**

- `preferences` (JSONB) - Store all preferences as JSON

**Option B: Separate table**

- `user_preferences` table with key-value pairs

**Recommendation:** Option A (simpler, sufficient)

**Example Preferences:**

```json
{
  "notifications": {
    "email": true,
    "push": true,
    "new_content": true,
    "subscription_reminders": false
  },
  "video": {
    "default_quality": "auto",
    "autoplay": false,
    "subtitles": false
  },
  "privacy": {
    "profile_visible": true,
    "show_watch_history": false
  }
}
```

---

## 📊 Priority Summary

### 🔴 HIGH PRIORITY (Must Have for MVP)

1. **Refresh Tokens Table** - Required for JWT security
2. **Password Reset Tokens** - Required for password reset (add to users table)
3. **OAuth Providers Table** - Required for social login (Google, Apple)
4. **System Settings Table** - Required for admin configuration

### 🟡 MEDIUM PRIORITY (Should Have)

5. **User Preferences** - Better UX (can use JSONB in users table)

### 🟢 LOW PRIORITY (Nice to Have)

6. **File Uploads Tracking** - Can add later
7. **Audit Log** - Can add later
8. **Search History** - Can add in Phase 2

---

## 🔧 Quick Fixes Needed

### 1. Add to Users Table

```sql
ALTER TABLE users ADD COLUMN password_reset_token TEXT;
ALTER TABLE users ADD COLUMN password_reset_expires_at TIMESTAMP;
```

### 2. Create Refresh Tokens Table

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP,
  device_info TEXT,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

### 3. Create OAuth Providers Table

```sql
CREATE TABLE user_oauth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  email TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_id)
);

CREATE INDEX idx_oauth_user_id ON user_oauth_providers(user_id);
CREATE INDEX idx_oauth_provider ON user_oauth_providers(provider, provider_id);
```

### 4. Create System Settings Table

```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  type TEXT DEFAULT 'string',
  category TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_settings_key ON system_settings(key);
CREATE INDEX idx_settings_category ON system_settings(category);
```

---

## ✅ Final Checklist

- [ ] Add password reset fields to users table
- [ ] Create refresh_tokens table
- [ ] Create user_oauth_providers table
- [ ] Create system_settings table
- [ ] Add preferences JSONB to users table (optional)
- [ ] Update Prisma schema
- [ ] Create migrations
- [ ] Update API endpoints

---

## 📝 Notes

- **Refresh Tokens:** Critical for JWT security - implement before MVP
- **Password Reset:** Required feature - add to users table
- **OAuth:** Required for social login - implement before MVP
- **System Settings:** Required for admin panel - implement before MVP
- **Others:** Can be added incrementally as needed

---

**Total Missing Tables:** ✅ ALL ADDED

**Status:** ✅ Complete - All missing tables have been added to Database_Schema_Design.md
