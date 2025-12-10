# Fitness Dance App - Database Schema Design

**Project:** Fitness Dance App  
**Domain:** zfitdance.com  
**Database:** PostgreSQL (Local for Development, Railway for Production)  
**ORM:** Prisma  
**Date:** [Date]

---

## 📋 Table of Contents

1. [Schema Overview](#schema-overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Database Tables](#database-tables)
4. [Prisma Schema](#prisma-schema)
5. [Indexes & Performance](#indexes--performance)
6. [Seed Data](#seed-data)
7. [Migrations](#migrations)

---

## 🎯 Schema Overview

### **Database Architecture**

- **Database:** PostgreSQL (Local for Development, Railway for Production)
- **ORM:** Prisma
- **Shared Database:** Both Member API and Admin API use the same database
- **Authentication:** JWT (JSON Web Tokens) - Custom authentication system

### **Key Design Principles**

1. **Normalization:** Proper 3NF normalization to avoid data redundancy
2. **Scalability:** Indexes on frequently queried fields
3. **Audit Trail:** Created/updated timestamps on all tables
4. **Soft Deletes:** Use `deletedAt` for important entities
5. **Relationships:** Proper foreign keys and cascading rules

---

## 📊 Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│    Users    │────────▶│ Subscriptions│         │   Videos    │
│  (Members)  │         │              │         │             │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                        │
      │                        │                        │
      ├────────────────────────┼────────────────────────┤
      │                        │                        │
      ▼                        ▼                        ▼
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Playlists  │         │   Payments   │         │   Ratings   │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                        │
      │                        │                        │
      ▼                        │                        ▼
┌─────────────┐                │                 ┌─────────────┐
│PlaylistItems│                │                 │  Feedback   │
└─────────────┘                │                 └─────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  Transactions│
                        └──────────────┘

┌─────────────┐         ┌──────────────┐
│ DanceStyles │         │IntensityLevel│
└─────────────┘         └──────────────┘
      │                        │
      └──────────┬─────────────┘
                 │
                 ▼
          ┌─────────────┐
          │   Videos    │
          └─────────────┘
                │
                │
      ┌─────────┴─────────┐
      │                   │
      ▼                   ▼
┌─────────────┐   ┌──────────────┐
│VideoCategory│──▶│VideoSubcategory│
└─────────────┘   └──────────────┘
      │
      │
      ▼
┌─────────────┐
│VideoCollection│ (Volumes/Collections)
└─────────────┘
      │
      │
      ▼
┌─────────────┐
│   Videos    │
└─────────────┘

┌─────────────┐         ┌──────────────┐
│  Knowledge  │         │  WatchHistory│
│  Articles   │         │              │
└─────────────┘         └──────────────┘

┌─────────────┐         ┌──────────────┐
│ AdminRoles  │────────▶│    Admins    │
│             │         │              │
└─────────────┘         └──────────────┘
                               │
                               │ (self-reference)
                               ▼
                        ┌──────────────┐
                        │    Admins    │
                        │ (created_by) │
                        └──────────────┘

┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│    Users    │────────▶│RefreshTokens │         │OAuthProviders│
└─────────────┘         └──────────────┘         └──────────────┘

┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│SystemSettings│        │ FileUploads  │         │  AuditLogs   │
└─────────────┘         └──────────────┘         └──────────────┘
                               │                        │
                               │                        │
                               ▼                        ▼
                        ┌──────────────┐         ┌──────────────┐
                        │    Users     │         │    Admins    │
                        └──────────────┘         └──────────────┘

┌─────────────┐
│SearchHistory│
└─────────────┘
       │
       ▼
┌─────────────┐
│    Users    │
└─────────────┘
```

---

## 📑 Database Tables

### **1. Users (Members)**

> **Note:** This table stores regular member users. Admin users are stored in a separate `admins` table.
>
> **Verification Requirements:**
>
> - Users can register with **email OR phone OR both**
> - At least **one must be provided** (email or phone)
> - At least **one must be verified** (email or phone)
> - Users can login with either verified email or verified phone

**Table: `users`**

| Column                          | Type      | Constraints   | Description                                                     |
| ------------------------------- | --------- | ------------- | --------------------------------------------------------------- |
| `id`                            | UUID      | PK            | User ID                                                         |
| `email`                         | TEXT      | UNIQUE        | User email (optional, but at least email or phone required)     |
| `phone_number`                  | TEXT      | UNIQUE        | Phone number (optional, but at least email or phone required)   |
| `password_hash`                 | TEXT      | NOT NULL      | Hashed password (bcrypt)                                        |
| `display_name`                  | TEXT      |               | Display name                                                    |
| `avatar_url`                    | TEXT      |               | Profile picture URL                                             |
| `date_of_birth`                 | DATE      |               | Date of birth (optional)                                        |
| `gender`                        | TEXT      |               | Gender (optional)                                               |
| `preferred_lang`                | TEXT      | DEFAULT 'en'  | Language preference                                             |
| `is_active`                     | BOOLEAN   | DEFAULT true  | Account active status                                           |
| **Email Verification Fields:**  |           |               |                                                                 |
| `is_email_verified`             | BOOLEAN   | DEFAULT false | Email verification status                                       |
| `email_verified_at`             | TIMESTAMP |               | Email verification date                                         |
| `email_verification_token`      | TEXT      |               | Email verification token (JWT/UUID)                             |
| `email_verification_expires_at` | TIMESTAMP |               | Email verification token expiry                                 |
| **Phone Verification Fields:**  |           |               |                                                                 |
| `is_phone_verified`             | BOOLEAN   | DEFAULT false | Phone verification status                                       |
| `phone_verified_at`             | TIMESTAMP |               | Phone verification date                                         |
| `phone_verification_code`       | TEXT      |               | SMS verification code (6 digits)                                |
| `phone_verification_expires_at` | TIMESTAMP |               | Phone verification code expiry                                  |
| **Password Reset Fields:**      |           |               |                                                                 |
| `password_reset_token`          | TEXT      |               | Password reset token                                            |
| `password_reset_expires_at`     | TIMESTAMP |               | Password reset token expiry                                     |
| `preferences`                   | JSONB     |               | User preferences (notifications, video settings, privacy, etc.) |
| `last_login_at`                 | TIMESTAMP |               | Last login timestamp                                            |
| `created_at`                    | TIMESTAMP | DEFAULT NOW() | Account creation date                                           |
| `updated_at`                    | TIMESTAMP | DEFAULT NOW() | Last update date                                                |
| `deleted_at`                    | TIMESTAMP |               | Soft delete timestamp                                           |

**Business Rules:**

- At least one of `email` or `phone_number` must be provided (enforced at application level)
- At least one of `is_email_verified` or `is_phone_verified` must be `true` for account activation
- Users can login with either verified email or verified phone number

**Indexes:**

- `idx_users_email` on `email` (where email is not null)
- `idx_users_phone_number` on `phone_number` (where phone_number is not null)
- `idx_users_is_active` on `is_active`
- Composite index on `(email, is_email_verified)` for login queries
- Composite index on `(phone_number, is_phone_verified)` for login queries

---

### **2. Admin Roles**

> **Note:** Defines different admin roles with permissions (e.g., super_admin, content_manager, support, etc.)

**Table: `admin_roles`**

| Column        | Type      | Constraints      | Description                     |
| ------------- | --------- | ---------------- | ------------------------------- |
| `id`          | UUID      | PK               | Role ID                         |
| `name`        | TEXT      | UNIQUE, NOT NULL | Role name (e.g., "super_admin") |
| `slug`        | TEXT      | UNIQUE, NOT NULL | URL-friendly slug               |
| `description` | TEXT      |                  | Role description                |
| `permissions` | JSONB     |                  | Permissions object (JSON)       |
| `is_active`   | BOOLEAN   | DEFAULT true     | Active status                   |
| `created_at`  | TIMESTAMP | DEFAULT NOW()    | Creation date                   |
| `updated_at`  | TIMESTAMP | DEFAULT NOW()    | Last update date                |

**Indexes:**

- `idx_admin_roles_slug` on `slug`
- `idx_admin_roles_is_active` on `is_active`

**Seed Data:**

- super_admin (Full access)
- content_manager (Manage videos, articles, knowledge)
- user_manager (Manage users, subscriptions)
- support (View feedback, respond to users)
- analytics_viewer (View analytics only)

---

### **3. Admins**

> **Note:** Admin users with role-based access control. Separate from regular users.

**Table: `admins`**

| Column          | Type      | Constraints            | Description                                |
| --------------- | --------- | ---------------------- | ------------------------------------------ |
| `id`            | UUID      | PK                     | Admin ID                                   |
| `email`         | TEXT      | UNIQUE, NOT NULL       | Admin email (for login)                    |
| `password_hash` | TEXT      | NOT NULL               | Hashed password (bcrypt)                   |
| `display_name`  | TEXT      |                        | Display name                               |
| `avatar_url`    | TEXT      |                        | Profile picture URL                        |
| `admin_role_id` | UUID      | FK → admin_roles       | Admin role                                 |
| `is_active`     | BOOLEAN   | DEFAULT true           | Account active status                      |
| `last_login_at` | TIMESTAMP |                        | Last login timestamp                       |
| `created_by`    | UUID      | FK → admins (nullable) | Created by admin ID (null for first admin) |
| `created_at`    | TIMESTAMP | DEFAULT NOW()          | Account creation date                      |
| `updated_at`    | TIMESTAMP | DEFAULT NOW()          | Last update date                           |
| `deleted_at`    | TIMESTAMP |                        | Soft delete timestamp                      |

**Indexes:**

- `idx_admins_email` on `email`
- `idx_admins_admin_role_id` on `admin_role_id`
- `idx_admins_is_active` on `is_active`

**Note:**

- `created_by` allows tracking which admin created another admin account
- `created_by` can be `NULL` for the first super admin (bootstrap admin)
- All subsequent admins must have a `created_by` value

---

### **4. Dance Styles**

**Table: `dance_styles`**

| Column        | Type      | Constraints      | Description                |
| ------------- | --------- | ---------------- | -------------------------- |
| `id`          | UUID      | PK               | Style ID                   |
| `name`        | TEXT      | UNIQUE, NOT NULL | Style name (e.g., "Zumba") |
| `slug`        | TEXT      | UNIQUE, NOT NULL | URL-friendly slug          |
| `description` | TEXT      |                  | Style description          |
| `icon_url`    | TEXT      |                  | Icon/image URL             |
| `is_active`   | BOOLEAN   | DEFAULT true     | Active status              |
| `sort_order`  | INTEGER   | DEFAULT 0        | Display order              |
| `created_at`  | TIMESTAMP | DEFAULT NOW()    | Creation date              |
| `updated_at`  | TIMESTAMP | DEFAULT NOW()    | Last update date           |

**Indexes:**

- `idx_dance_styles_slug` on `slug`
- `idx_dance_styles_is_active` on `is_active`

**Seed Data:**

- Zumba Fitness Dance
- Bollywood Dance
- K-pop Fitness Dance
- Dance Choreography
- TikTok Dance Basic

---

### **5. Intensity Levels**

**Table: `intensity_levels`**

| Column        | Type      | Constraints      | Description       |
| ------------- | --------- | ---------------- | ----------------- |
| `id`          | UUID      | PK               | Intensity ID      |
| `name`        | TEXT      | UNIQUE, NOT NULL | Level name        |
| `slug`        | TEXT      | UNIQUE, NOT NULL | URL-friendly slug |
| `description` | TEXT      |                  | Level description |
| `sort_order`  | INTEGER   | DEFAULT 0        | Display order     |
| `created_at`  | TIMESTAMP | DEFAULT NOW()    | Creation date     |
| `updated_at`  | TIMESTAMP | DEFAULT NOW()    | Last update date  |

**Indexes:**

- `idx_intensity_levels_slug` on `slug`

**Seed Data:**

- Slow & Low Intensity
- Fast & High Intensity

---

### **5.5. Video Categories**

**Table: `video_categories`**

| Column        | Type      | Constraints      | Description           |
| ------------- | --------- | ---------------- | --------------------- |
| `id`          | UUID      | PK               | Category ID           |
| `name`        | TEXT      | UNIQUE, NOT NULL | Category name         |
| `slug`        | TEXT      | UNIQUE, NOT NULL | URL-friendly slug     |
| `description` | TEXT      |                  | Category description  |
| `icon_url`    | TEXT      |                  | Icon/image URL        |
| `is_active`   | BOOLEAN   | DEFAULT true     | Active status         |
| `sort_order`  | INTEGER   | DEFAULT 0        | Display order         |
| `created_at`  | TIMESTAMP | DEFAULT NOW()    | Creation date         |
| `updated_at`  | TIMESTAMP | DEFAULT NOW()    | Last update date      |
| `deleted_at`  | TIMESTAMP |                  | Soft delete timestamp |

**Indexes:**

- `idx_video_categories_slug` on `slug`
- `idx_video_categories_is_active` on `is_active`

**Example Categories:**

- Full Workout
- Tutorial
- Warm-up
- Cool-down
- Choreography
- Dance Basics

---

### **5.6. Video Subcategories**

**Table: `video_subcategories`**

| Column        | Type      | Constraints           | Description             |
| ------------- | --------- | --------------------- | ----------------------- |
| `id`          | UUID      | PK                    | Subcategory ID          |
| `category_id` | UUID      | FK → video_categories | Parent category         |
| `name`        | TEXT      | UNIQUE, NOT NULL      | Subcategory name        |
| `slug`        | TEXT      | UNIQUE, NOT NULL      | URL-friendly slug       |
| `description` | TEXT      |                       | Subcategory description |
| `is_active`   | BOOLEAN   | DEFAULT true          | Active status           |
| `sort_order`  | INTEGER   | DEFAULT 0             | Display order           |
| `created_at`  | TIMESTAMP | DEFAULT NOW()         | Creation date           |
| `updated_at`  | TIMESTAMP | DEFAULT NOW()         | Last update date        |
| `deleted_at`  | TIMESTAMP |                       | Soft delete timestamp   |

**Indexes:**

- `idx_video_subcategories_category_id` on `category_id`
- `idx_video_subcategories_slug` on `slug`
- `idx_video_subcategories_is_active` on `is_active`

**Example Subcategories:**

- Category: "Full Workout" → Subcategories: "30 Min", "45 Min", "60 Min"
- Category: "Tutorial" → Subcategories: "Step-by-Step", "Tips & Tricks", "Technique"
- Category: "Choreography" → Subcategories: "Beginner", "Intermediate", "Advanced"

---

### **5.7. Video Collections (Volumes)**

**Table: `video_collections`**

| Column          | Type      | Constraints           | Description                                        |
| --------------- | --------- | --------------------- | -------------------------------------------------- |
| `id`            | UUID      | PK                    | Collection ID                                      |
| `category_id`   | UUID      | FK → video_categories | Parent category                                    |
| `name`          | TEXT      | NOT NULL              | Collection name (e.g., "ZIN™ 120: FIESTA FOREVER") |
| `slug`          | TEXT      | UNIQUE, NOT NULL      | URL-friendly slug                                  |
| `description`   | TEXT      |                       | Collection description                             |
| `thumbnail_url` | TEXT      |                       | Collection thumbnail/image URL                     |
| `is_featured`   | BOOLEAN   | DEFAULT false         | Featured collection flag                           |
| `is_active`     | BOOLEAN   | DEFAULT true          | Active status                                      |
| `sort_order`    | INTEGER   | DEFAULT 0             | Display order                                      |
| `created_at`    | TIMESTAMP | DEFAULT NOW()         | Creation date                                      |
| `updated_at`    | TIMESTAMP | DEFAULT NOW()         | Last update date                                   |
| `deleted_at`    | TIMESTAMP |                       | Soft delete timestamp                              |

**Indexes:**

- `idx_video_collections_category_id` on `category_id`
- `idx_video_collections_slug` on `slug`
- `idx_video_collections_is_featured` on `is_featured`
- `idx_video_collections_is_active` on `is_active`

**Example Collections:**

- Category: "ZIN™ Volumes" → Collections: "ZIN™ 120: FIESTA FOREVER", "ZIN™ 119: THAT ZUMBA FEELING"
- Category: "Choreo Challenge" → Collections: "Beginner Challenges", "Advanced Challenges"
- Category: "Mega Mix Choreos" → Collections: "2025 Mega Mix", "2024 Mega Mix"

**Notes:**

- Collections are like "system playlists" that admins create
- Each collection belongs to a category
- Collections can be featured (shown prominently)
- Videos can belong to a collection

---

### **6. Videos**

**Table: `videos`**

| Column                | Type      | Constraints                         | Description                                             |
| --------------------- | --------- | ----------------------------------- | ------------------------------------------------------- |
| `id`                  | UUID      | PK                                  | Video ID                                                |
| `title`               | TEXT      | NOT NULL                            | Video title                                             |
| `description`         | TEXT      |                                     | Video description                                       |
| `category_id`         | UUID      | FK → video_categories               | Video category                                          |
| `subcategory_id`      | UUID      | FK → video_subcategories (nullable) | Video subcategory (optional)                            |
| `collection_id`       | UUID      | FK → video_collections (nullable)   | Video collection/volume (optional)                      |
| `dance_style_id`      | UUID      | FK → dance_styles                   | Dance style                                             |
| `intensity_level_id`  | UUID      | FK → intensity_levels               | Intensity level                                         |
| `cloudflare_video_id` | TEXT      | UNIQUE                              | Cloudflare Stream video ID                              |
| `youtube_video_id`    | TEXT      |                                     | YouTube video ID (for shorts)                           |
| `video_type`          | TEXT      | DEFAULT 'premium'                   | 'premium', 'youtube_short'                              |
| `audio_url`           | TEXT      |                                     | Audio-only track URL (optional, can extract from video) |
| `has_audio_mode`      | BOOLEAN   | DEFAULT true                        | Whether audio-only mode is available                    |
| `thumbnail_url`       | TEXT      |                                     | Thumbnail image URL                                     |
| `duration_seconds`    | INTEGER   |                                     | Video duration in seconds                               |
| `view_count`          | INTEGER   | DEFAULT 0                           | Total view count                                        |
| `is_published`        | BOOLEAN   | DEFAULT false                       | Published status                                        |
| `published_at`        | TIMESTAMP |                                     | Publication date                                        |
| `sort_order`          | INTEGER   | DEFAULT 0                           | Display order                                           |
| `created_at`          | TIMESTAMP | DEFAULT NOW()                       | Creation date                                           |
| `updated_at`          | TIMESTAMP | DEFAULT NOW()                       | Last update date                                        |
| `deleted_at`          | TIMESTAMP |                                     | Soft delete timestamp                                   |

**Indexes:**

- `idx_videos_category_id` on `category_id`
- `idx_videos_subcategory_id` on `subcategory_id`
- `idx_videos_collection_id` on `collection_id`
- `idx_videos_dance_style_id` on `dance_style_id`
- `idx_videos_intensity_level_id` on `intensity_level_id`
- `idx_videos_is_published` on `is_published`
- `idx_videos_video_type` on `video_type`
- `idx_videos_cloudflare_video_id` on `cloudflare_video_id`
- `idx_videos_has_audio_mode` on `has_audio_mode`
- Composite index on `(category_id, subcategory_id)` for filtering
- Composite index on `(category_id, collection_id)` for collection filtering

**Notes:**

- `audio_url`: Optional field for storing a separate audio-only track URL. If not provided, audio can be extracted from the Cloudflare Stream video using their API.
- `has_audio_mode`: When `true`, users can switch between video and audio-only playback modes. When `false`, only video mode is available.
- Full-text search index on `title` and `description`

---

### **7. Subscription Plans**

**Table: `subscription_plans`**

| Column             | Type      | Constraints   | Description                 |
| ------------------ | --------- | ------------- | --------------------------- |
| `id`               | UUID      | PK            | Plan ID                     |
| `name`             | TEXT      | NOT NULL      | Plan name (e.g., "1 Month") |
| `duration_months`  | INTEGER   | NOT NULL      | Duration in months          |
| `price_mmk`        | DECIMAL   | NOT NULL      | Price in MMK                |
| `discount_percent` | DECIMAL   | DEFAULT 0     | Discount percentage         |
| `is_active`        | BOOLEAN   | DEFAULT true  | Active status               |
| `sort_order`       | INTEGER   | DEFAULT 0     | Display order               |
| `created_at`       | TIMESTAMP | DEFAULT NOW() | Creation date               |
| `updated_at`       | TIMESTAMP | DEFAULT NOW() | Last update date            |

**Indexes:**

- `idx_subscription_plans_duration` on `duration_months`
- `idx_subscription_plans_is_active` on `is_active`

**Seed Data:**

- 1 Month (base price)
- 3 Months (discounted)
- 6 Months (discounted)
- 12 Months (discounted)

---

### **8. Subscriptions**

**Table: `subscriptions`**

| Column                 | Type      | Constraints             | Description                      |
| ---------------------- | --------- | ----------------------- | -------------------------------- |
| `id`                   | UUID      | PK                      | Subscription ID                  |
| `user_id`              | UUID      | FK → users              | User ID                          |
| `subscription_plan_id` | UUID      | FK → subscription_plans | Plan ID                          |
| `status`               | TEXT      | NOT NULL                | 'active', 'expired', 'cancelled' |
| `trial_started_at`     | TIMESTAMP |                         | Trial start date                 |
| `trial_ends_at`        | TIMESTAMP |                         | Trial end date (4 days)          |
| `started_at`           | TIMESTAMP |                         | Subscription start date          |
| `expires_at`           | TIMESTAMP | NOT NULL                | Subscription expiry date         |
| `auto_renew`           | BOOLEAN   | DEFAULT true            | Auto-renewal flag                |
| `cancelled_at`         | TIMESTAMP |                         | Cancellation date                |
| `created_at`           | TIMESTAMP | DEFAULT NOW()           | Creation date                    |
| `updated_at`           | TIMESTAMP | DEFAULT NOW()           | Last update date                 |
| `deleted_at`           | TIMESTAMP |                         | Soft delete timestamp            |

**Indexes:**

- `idx_subscriptions_user_id` on `user_id`
- `idx_subscriptions_status` on `status`
- `idx_subscriptions_expires_at` on `expires_at`
- Composite index on `(user_id, status, expires_at)`

**Notes:**

- All subscriptions provide access to **all dance styles** (no style-specific subscriptions)

---

### **9. Payments**

**Table: `payments`**

| Column                | Type      | Constraints        | Description                      |
| --------------------- | --------- | ------------------ | -------------------------------- |
| `id`                  | UUID      | PK                 | Payment ID                       |
| `user_id`             | UUID      | FK → users         | User ID                          |
| `subscription_id`     | UUID      | FK → subscriptions | Subscription ID                  |
| `amount_mmk`          | DECIMAL   | NOT NULL           | Payment amount                   |
| `currency`            | TEXT      | DEFAULT 'MMK'      | Currency code                    |
| `payment_method`      | TEXT      | DEFAULT 'mmqr'     | Payment method                   |
| `mmqr_transaction_id` | TEXT      |                    | MMQR transaction ID              |
| `mmqr_qr_code`        | TEXT      |                    | MMQR QR code data                |
| `status`              | TEXT      | NOT NULL           | 'pending', 'completed', 'failed' |
| `paid_at`             | TIMESTAMP |                    | Payment completion date          |
| `created_at`          | TIMESTAMP | DEFAULT NOW()      | Creation date                    |
| `updated_at`          | TIMESTAMP | DEFAULT NOW()      | Last update date                 |

**Indexes:**

- `idx_payments_user_id` on `user_id`
- `idx_payments_subscription_id` on `subscription_id`
- `idx_payments_status` on `status`
- `idx_payments_mmqr_transaction_id` on `mmqr_transaction_id`

---

### **10. Playlists**

**Table: `playlists`**

| Column        | Type      | Constraints   | Description           |
| ------------- | --------- | ------------- | --------------------- |
| `id`          | UUID      | PK            | Playlist ID           |
| `user_id`     | UUID      | FK → users    | User ID               |
| `name`        | TEXT      | NOT NULL      | Playlist name         |
| `description` | TEXT      |               | Playlist description  |
| `is_public`   | BOOLEAN   | DEFAULT false | Public/private flag   |
| `created_at`  | TIMESTAMP | DEFAULT NOW() | Creation date         |
| `updated_at`  | TIMESTAMP | DEFAULT NOW() | Last update date      |
| `deleted_at`  | TIMESTAMP |               | Soft delete timestamp |

**Indexes:**

- `idx_playlists_user_id` on `user_id`
- `idx_playlists_is_public` on `is_public`

---

### **11. Playlist Items**

**Table: `playlist_items`**

| Column        | Type      | Constraints    | Description                    |
| ------------- | --------- | -------------- | ------------------------------ |
| `id`          | UUID      | PK             | Item ID                        |
| `playlist_id` | UUID      | FK → playlists | Playlist ID                    |
| `video_id`    | UUID      | FK → videos    | Video ID                       |
| `sort_order`  | INTEGER   | DEFAULT 0      | Display order (for reordering) |
| `added_at`    | TIMESTAMP | DEFAULT NOW()  | Added date                     |

**Indexes:**

- `idx_playlist_items_playlist_id` on `playlist_id`
- `idx_playlist_items_video_id` on `video_id`
- Composite unique index on `(playlist_id, video_id)` to prevent duplicates
- Composite index on `(playlist_id, sort_order)` for ordering

---

### **12. Ratings**

**Table: `ratings`**

| Column       | Type      | Constraints   | Description        |
| ------------ | --------- | ------------- | ------------------ |
| `id`         | UUID      | PK            | Rating ID          |
| `user_id`    | UUID      | FK → users    | User ID            |
| `video_id`   | UUID      | FK → videos   | Video ID           |
| `rating`     | INTEGER   | NOT NULL      | Rating (1-5 stars) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation date      |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update date   |

**Indexes:**

- `idx_ratings_user_id` on `user_id`
- `idx_ratings_video_id` on `video_id`
- Composite unique index on `(user_id, video_id)` - one rating per user per video

---

### **13. Feedback**

**Table: `feedback`**

| Column           | Type      | Constraints            | Description                 |
| ---------------- | --------- | ---------------------- | --------------------------- |
| `id`             | UUID      | PK                     | Feedback ID                 |
| `user_id`        | UUID      | FK → users             | User ID                     |
| `video_id`       | UUID      | FK → videos (nullable) | Video ID (null for general) |
| `subject`        | TEXT      |                        | Feedback subject            |
| `message`        | TEXT      | NOT NULL               | Feedback message            |
| `rating`         | INTEGER   |                        | Associated rating (1-5)     |
| `status`         | TEXT      | DEFAULT 'new'          | 'new', 'read', 'responded'  |
| `admin_response` | TEXT      |                        | Admin response              |
| `responded_at`   | TIMESTAMP |                        | Response date               |
| `created_at`     | TIMESTAMP | DEFAULT NOW()          | Creation date               |
| `updated_at`     | TIMESTAMP | DEFAULT NOW()          | Last update date            |
| `deleted_at`     | TIMESTAMP |                        | Soft delete timestamp       |

**Indexes:**

- `idx_feedback_user_id` on `user_id`
- `idx_feedback_video_id` on `video_id`
- `idx_feedback_status` on `status`

---

### **14. Knowledge Articles**

**Table: `knowledge_articles`**

| Column           | Type      | Constraints                  | Description                   |
| ---------------- | --------- | ---------------------------- | ----------------------------- |
| `id`             | UUID      | PK                           | Article ID                    |
| `title`          | TEXT      | NOT NULL                     | Article title                 |
| `content`        | TEXT      | NOT NULL                     | Article content (markdown)    |
| `category`       | TEXT      | NOT NULL                     | 'fitness', 'dance'            |
| `dance_style_id` | UUID      | FK → dance_styles (nullable) | Related dance style           |
| `thumbnail_url`  | TEXT      |                              | Thumbnail image URL           |
| `reading_time`   | INTEGER   |                              | Estimated reading time (mins) |
| `is_published`   | BOOLEAN   | DEFAULT false                | Published status              |
| `published_at`   | TIMESTAMP |                              | Publication date              |
| `view_count`     | INTEGER   | DEFAULT 0                    | View count                    |
| `created_at`     | TIMESTAMP | DEFAULT NOW()                | Creation date                 |
| `updated_at`     | TIMESTAMP | DEFAULT NOW()                | Last update date              |
| `deleted_at`     | TIMESTAMP |                              | Soft delete timestamp         |

**Indexes:**

- `idx_knowledge_articles_category` on `category`
- `idx_knowledge_articles_is_published` on `is_published`
- `idx_knowledge_articles_dance_style_id` on `dance_style_id`
- Full-text search index on `title` and `content`

---

### **15. Watch History**

**Table: `watch_history`**

| Column            | Type      | Constraints     | Description                                     |
| ----------------- | --------- | --------------- | ----------------------------------------------- |
| `id`              | UUID      | PK              | History ID                                      |
| `user_id`         | UUID      | FK → users      | User ID                                         |
| `video_id`        | UUID      | FK → videos     | Video ID                                        |
| `watched_seconds` | INTEGER   | DEFAULT 0       | Seconds watched                                 |
| `completed`       | BOOLEAN   | DEFAULT false   | Completion flag                                 |
| `playback_mode`   | TEXT      | DEFAULT 'video' | 'video' or 'audio' - tracks which mode was used |
| `last_watched_at` | TIMESTAMP | DEFAULT NOW()   | Last watch date                                 |
| `created_at`      | TIMESTAMP | DEFAULT NOW()   | Creation date                                   |
| `updated_at`      | TIMESTAMP | DEFAULT NOW()   | Last update date                                |

**Indexes:**

- `idx_watch_history_user_id` on `user_id`
- `idx_watch_history_video_id` on `video_id`
- `idx_watch_history_last_watched_at` on `last_watched_at`
- `idx_watch_history_playback_mode` on `playback_mode`
- Composite unique index on `(user_id, video_id)` - one record per user per video

**Notes:**

- `playback_mode`: Tracks whether the user watched the video in 'video' or 'audio' mode. This helps analyze user preferences and content consumption patterns.

---

### **16. Favorites**

**Table: `favorites`**

| Column       | Type      | Constraints   | Description   |
| ------------ | --------- | ------------- | ------------- |
| `id`         | UUID      | PK            | Favorite ID   |
| `user_id`    | UUID      | FK → users    | User ID       |
| `video_id`   | UUID      | FK → videos   | Video ID      |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation date |

**Indexes:**

- `idx_favorites_user_id` on `user_id`
- `idx_favorites_video_id` on `video_id`
- Composite unique index on `(user_id, video_id)` - prevent duplicates

---

### **17. Notifications**

**Table: `notifications`**

| Column       | Type      | Constraints   | Description          |
| ------------ | --------- | ------------- | -------------------- |
| `id`         | UUID      | PK            | Notification ID      |
| `user_id`    | UUID      | FK → users    | User ID              |
| `type`       | TEXT      | NOT NULL      | Notification type    |
| `title`      | TEXT      | NOT NULL      | Notification title   |
| `message`    | TEXT      | NOT NULL      | Notification message |
| `data`       | JSONB     |               | Additional data      |
| `is_read`    | BOOLEAN   | DEFAULT false | Read status          |
| `read_at`    | TIMESTAMP |               | Read date            |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation date        |

**Indexes:**

- `idx_notifications_user_id` on `user_id`
- `idx_notifications_is_read` on `is_read`
- `idx_notifications_created_at` on `created_at`
- Composite index on `(user_id, is_read, created_at)`

---

### **18. Refresh Tokens**

**Table: `refresh_tokens`**

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

**Indexes:**

- `idx_refresh_tokens_user_id` on `user_id`
- `idx_refresh_tokens_token` on `token`
- `idx_refresh_tokens_expires_at` on `expires_at`

**Notes:**

- Tokens should be hashed before storage
- Expired tokens should be cleaned up periodically
- Cascade delete when user is deleted

---

### **19. OAuth Providers**

**Table: `user_oauth_providers`**

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

- `idx_oauth_user_id` on `user_id`
- `idx_oauth_provider` on `(provider, provider_id)` - Unique constraint
- Unique constraint on `(provider, provider_id)`

**Notes:**

- One user can have multiple OAuth providers
- Tokens should be encrypted before storage
- Cascade delete when user is deleted

---

### **20. System Settings**

**Table: `system_settings`**

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

**Indexes:**

- `idx_settings_key` on `key` (unique)
- `idx_settings_category` on `category`

**Example Settings:**

- `app_name`: "ZFit Dance"
- `free_trial_days`: 4
- `mmqr_enabled`: true
- `email_from_address`: "noreply@zfitdance.com"
- `max_video_upload_size_mb`: 2048

---

### **21. File Uploads**

**Table: `file_uploads`**

| Column          | Type      | Constraints            | Description                                    |
| --------------- | --------- | ---------------------- | ---------------------------------------------- |
| `id`            | UUID      | PK                     | File ID                                        |
| `user_id`       | UUID      | FK → users (nullable)  | Uploader (if user upload)                      |
| `admin_id`      | UUID      | FK → admins (nullable) | Uploader (if admin upload)                     |
| `file_type`     | TEXT      | NOT NULL               | 'video', 'image', 'audio', etc.                |
| `file_name`     | TEXT      | NOT NULL               | Original file name                             |
| `file_size`     | BIGINT    |                        | File size in bytes                             |
| `mime_type`     | TEXT      |                        | MIME type                                      |
| `storage_url`   | TEXT      | NOT NULL               | Storage URL (Supabase/Cloudflare)              |
| `storage_key`   | TEXT      |                        | Storage key/path                               |
| `upload_status` | TEXT      | DEFAULT 'pending'      | 'pending', 'processing', 'completed', 'failed' |
| `metadata`      | JSONB     |                        | Additional metadata                            |
| `created_at`    | TIMESTAMP | DEFAULT NOW()          | Creation date                                  |
| `updated_at`    | TIMESTAMP | DEFAULT NOW()          | Last update date                               |

**Indexes:**

- `idx_file_uploads_user_id` on `user_id`
- `idx_file_uploads_admin_id` on `admin_id`
- `idx_file_uploads_file_type` on `file_type`
- `idx_file_uploads_upload_status` on `upload_status`

**Notes:**

- Either `user_id` or `admin_id` should be provided (not both)
- Used to track all file uploads for cleanup and monitoring

---

### **22. Audit Logs**

**Table: `audit_logs`**

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

**Indexes:**

- `idx_audit_logs_user_id` on `user_id`
- `idx_audit_logs_admin_id` on `admin_id`
- `idx_audit_logs_action` on `action`
- `idx_audit_logs_entity` on `(entity_type, entity_id)`
- `idx_audit_logs_created_at` on `created_at`

**Notes:**

- Either `user_id` or `admin_id` should be provided (not both)
- Used for security audit trail and debugging
- Consider archiving old logs periodically

---

### **23. Search History**

**Table: `search_history`**

| Column          | Type      | Constraints           | Description                  |
| --------------- | --------- | --------------------- | ---------------------------- |
| `id`            | UUID      | PK                    | Search ID                    |
| `user_id`       | UUID      | FK → users (nullable) | User ID (null for anonymous) |
| `query`         | TEXT      | NOT NULL              | Search query                 |
| `results_count` | INTEGER   | DEFAULT 0             | Number of results            |
| `created_at`    | TIMESTAMP | DEFAULT NOW()         | Creation date                |

**Indexes:**

- `idx_search_history_user_id` on `user_id`
- `idx_search_history_query` on `query` (for analytics)
- `idx_search_history_created_at` on `created_at`

**Notes:**

- Used for analytics and search suggestions
- Can be anonymous (user_id = null)
- Consider cleaning up old searches periodically

---

## 🔧 Prisma Schema

### **Complete Prisma Schema File**

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USER & AUTHENTICATION
// ============================================

// Regular Member Users
// Note: At least one of email or phone_number must be provided and verified
model User {
  id                          String    @id @default(uuid())
  email                       String?   @unique
  phoneNumber                 String?   @unique
  passwordHash                String    @map("password_hash")
  displayName                 String?   @map("display_name")
  avatarUrl                   String?   @map("avatar_url")
  dateOfBirth                 DateTime? @map("date_of_birth") @db.Date
  gender                      String?
  preferredLang               String    @default("en") @map("preferred_lang")
  isActive                    Boolean   @default(true) @map("is_active")

  // Email Verification
  isEmailVerified             Boolean   @default(false) @map("is_email_verified")
  emailVerifiedAt             DateTime? @map("email_verified_at")
  emailVerificationToken      String?   @map("email_verification_token")
  emailVerificationExpiresAt  DateTime? @map("email_verification_expires_at")

  // Phone Verification
  isPhoneVerified             Boolean   @default(false) @map("is_phone_verified")
  phoneVerifiedAt             DateTime? @map("phone_verified_at")
  phoneVerificationCode       String?   @map("phone_verification_code")
  phoneVerificationExpiresAt  DateTime? @map("phone_verification_expires_at")

  // Password Reset
  passwordResetToken          String?   @map("password_reset_token")
  passwordResetExpiresAt      DateTime? @map("password_reset_expires_at")

  // Preferences
  preferences                 Json?     // User preferences (JSONB)

  lastLoginAt                 DateTime? @map("last_login_at")
  createdAt                   DateTime  @default(now()) @map("created_at")
  updatedAt                   DateTime  @updatedAt @map("updated_at")
  deletedAt                   DateTime? @map("deleted_at")

  // Relations
  subscriptions      Subscription[]
  payments           Payment[]
  playlists          Playlist[]
  ratings            Rating[]
  feedback           Feedback[]
  watchHistory       WatchHistory[]
  favorites          Favorite[]
  notifications      Notification[]
  refreshTokens      RefreshToken[]
  oauthProviders     UserOAuthProvider[]
  fileUploads        FileUpload[]
  auditLogs          AuditLog[]
  searchHistory      SearchHistory[]

  @@index([email])
  @@index([phoneNumber])
  @@index([isActive])
  @@index([email, isEmailVerified])
  @@index([phoneNumber, isPhoneVerified])
  @@map("users")
}

// Admin Roles (for role-based access control)
model AdminRole {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  description String?
  permissions Json?    // JSON object with permissions
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  admins Admin[]

  @@index([slug])
  @@index([isActive])
  @@map("admin_roles")
}

// Admin Users (separate from regular users)
model Admin {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  displayName   String?   @map("display_name")
  avatarUrl     String?   @map("avatar_url")
  adminRoleId   String    @map("admin_role_id")
  isActive      Boolean   @default(true) @map("is_active")
  lastLoginAt   DateTime? @map("last_login_at")
  createdById   String?   @map("created_by")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  // Relations
  adminRole AdminRole @relation(fields: [adminRoleId], references: [id])
  createdBy Admin?    @relation("AdminCreatedBy", fields: [createdById], references: [id])
  createdAdmins Admin[] @relation("AdminCreatedBy")
  fileUploads FileUpload[]
  auditLogs   AuditLog[]

  @@index([email])
  @@index([adminRoleId])
  @@index([isActive])
  @@map("admins")
}

// ============================================
// CONTENT CATEGORIES
// ============================================

model VideoCategory {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  description String?
  iconUrl     String?  @map("icon_url")
  isActive    Boolean  @default(true) @map("is_active")
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  // Relations
  subcategories VideoSubcategory[]
  collections   VideoCollection[]
  videos        Video[]

  @@index([slug])
  @@index([isActive])
  @@map("video_categories")
}

model VideoCollection {
  id          String   @id @default(uuid())
  categoryId  String   @map("category_id")
  name        String
  slug        String   @unique
  description String?
  thumbnailUrl String? @map("thumbnail_url")
  isFeatured  Boolean  @default(false) @map("is_featured")
  isActive    Boolean  @default(true) @map("is_active")
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  // Relations
  category VideoCategory @relation(fields: [categoryId], references: [id])
  videos   Video[]

  @@index([categoryId])
  @@index([slug])
  @@index([isFeatured])
  @@index([isActive])
  @@map("video_collections")
}

model VideoSubcategory {
  id          String   @id @default(uuid())
  categoryId  String   @map("category_id")
  name        String   @unique
  slug        String   @unique
  description String?
  isActive    Boolean  @default(true) @map("is_active")
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  // Relations
  category VideoCategory @relation(fields: [categoryId], references: [id])
  videos   Video[]

  @@index([categoryId])
  @@index([slug])
  @@index([isActive])
  @@map("video_subcategories")
}

model DanceStyle {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  description String?
  iconUrl     String?  @map("icon_url")
  isActive    Boolean  @default(true) @map("is_active")
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  videos           Video[]
  knowledgeArticles KnowledgeArticle[]

  @@index([slug])
  @@index([isActive])
  @@map("dance_styles")
}

model IntensityLevel {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  description String?
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  videos Video[]

  @@index([slug])
  @@map("intensity_levels")
}

// ============================================
// VIDEO CONTENT
// ============================================

model Video {
  id                String    @id @default(uuid())
  title             String
  description       String?
  categoryId        String    @map("category_id")
  subcategoryId     String?   @map("subcategory_id")
  collectionId      String?   @map("collection_id")
  danceStyleId      String    @map("dance_style_id")
  intensityLevelId  String    @map("intensity_level_id")
  cloudflareVideoId String?   @unique @map("cloudflare_video_id")
  youtubeVideoId    String?   @map("youtube_video_id")
  videoType         String    @default("premium") @map("video_type") // 'premium' | 'youtube_short'
  audioUrl          String?   @map("audio_url") // Optional audio-only track URL
  hasAudioMode      Boolean   @default(true) @map("has_audio_mode") // Whether audio-only mode is available
  thumbnailUrl      String?   @map("thumbnail_url")
  durationSeconds   Int?      @map("duration_seconds")
  viewCount         Int       @default(0) @map("view_count")
  isPublished       Boolean   @default(false) @map("is_published")
  publishedAt       DateTime? @map("published_at")
  sortOrder         Int       @default(0) @map("sort_order")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  deletedAt         DateTime? @map("deleted_at")

  // Relations
  category        VideoCategory      @relation(fields: [categoryId], references: [id])
  subcategory     VideoSubcategory?  @relation(fields: [subcategoryId], references: [id])
  collection      VideoCollection?   @relation(fields: [collectionId], references: [id])
  danceStyle      DanceStyle         @relation(fields: [danceStyleId], references: [id])
  intensityLevel  IntensityLevel     @relation(fields: [intensityLevelId], references: [id])
  playlistItems   PlaylistItem[]
  ratings         Rating[]
  feedback        Feedback[]
  watchHistory    WatchHistory[]
  favorites       Favorite[]

  @@index([categoryId])
  @@index([subcategoryId])
  @@index([collectionId])
  @@index([danceStyleId])
  @@index([intensityLevelId])
  @@index([isPublished])
  @@index([videoType])
  @@index([cloudflareVideoId])
  @@index([categoryId, subcategoryId])
  @@index([categoryId, collectionId])
  @@map("videos")
}

// ============================================
// SUBSCRIPTION & PAYMENT
// ============================================

model SubscriptionPlan {
  id             String   @id @default(uuid())
  name           String
  durationMonths Int      @map("duration_months")
  priceMmk       Decimal  @map("price_mmk") @db.Decimal(10, 2)
  discountPercent Decimal @default(0) @map("discount_percent") @db.Decimal(5, 2)
  isActive       Boolean  @default(true) @map("is_active")
  sortOrder      Int      @default(0) @map("sort_order")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  // Relations
  subscriptions Subscription[]

  @@index([durationMonths])
  @@index([isActive])
  @@map("subscription_plans")
}

model Subscription {
  id                String    @id @default(uuid())
  userId            String    @map("user_id")
  subscriptionPlanId String  @map("subscription_plan_id")
  status            String    // 'active' | 'expired' | 'cancelled'
  trialStartedAt    DateTime? @map("trial_started_at")
  trialEndsAt       DateTime? @map("trial_ends_at")
  startedAt         DateTime? @map("started_at")
  expiresAt         DateTime  @map("expires_at")
  autoRenew         Boolean   @default(true) @map("auto_renew")
  cancelledAt       DateTime? @map("cancelled_at")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  deletedAt        DateTime? @map("deleted_at")

  // Relations
  user            User         @relation(fields: [userId], references: [id])
  subscriptionPlan SubscriptionPlan @relation(fields: [subscriptionPlanId], references: [id])
  payments        Payment[]

  @@index([userId])
  @@index([status])
  @@index([expiresAt])
  @@index([userId, status, expiresAt])
  @@map("subscriptions")
}

model Payment {
  id                String    @id @default(uuid())
  userId            String    @map("user_id")
  subscriptionId    String    @map("subscription_id")
  amountMmk         Decimal   @map("amount_mmk") @db.Decimal(10, 2)
  currency          String    @default("MMK")
  paymentMethod     String    @default("mmqr") @map("payment_method")
  mmqrTransactionId String?   @map("mmqr_transaction_id")
  mmqrQrCode       String?   @map("mmqr_qr_code")
  status            String    // 'pending' | 'completed' | 'failed'
  paidAt            DateTime? @map("paid_at")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  // Relations
  user         User      @relation(fields: [userId], references: [id])
  subscription Subscription @relation(fields: [subscriptionId], references: [id])

  @@index([userId])
  @@index([subscriptionId])
  @@index([status])
  @@index([mmqrTransactionId])
  @@map("payments")
}

// ============================================
// PLAYLISTS
// ============================================

model Playlist {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  name        String
  description String?
  isPublic    Boolean   @default(false) @map("is_public")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt  DateTime? @map("deleted_at")

  // Relations
  user  User        @relation(fields: [userId], references: [id])
  items PlaylistItem[]

  @@index([userId])
  @@index([isPublic])
  @@map("playlists")
}

model PlaylistItem {
  id         String   @id @default(uuid())
  playlistId String  @map("playlist_id")
  videoId    String   @map("video_id")
  sortOrder  Int      @default(0) @map("sort_order")
  addedAt    DateTime @default(now()) @map("added_at")

  // Relations
  playlist Playlist @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  video    Video    @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@unique([playlistId, videoId])
  @@index([playlistId])
  @@index([videoId])
  @@index([playlistId, sortOrder])
  @@map("playlist_items")
}

// ============================================
// RATINGS & FEEDBACK
// ============================================

model Rating {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  videoId   String   @map("video_id")
  rating    Int      // 1-5
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  user  User @relation(fields: [userId], references: [id])
  video Video   @relation(fields: [videoId], references: [id])

  @@unique([userId, videoId])
  @@index([userId])
  @@index([videoId])
  @@map("ratings")
}

model Feedback {
  id           String    @id @default(uuid())
  userId       String    @map("user_id")
  videoId      String?   @map("video_id")
  subject      String?
  message      String
  rating       Int?
  status       String    @default("new") // 'new' | 'read' | 'responded'
  adminResponse String?  @map("admin_response")
  respondedAt  DateTime? @map("responded_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  // Relations
  user  User @relation(fields: [userId], references: [id])
  video Video?  @relation(fields: [videoId], references: [id])

  @@index([userId])
  @@index([videoId])
  @@index([status])
  @@map("feedback")
}

// ============================================
// KNOWLEDGE
// ============================================

model KnowledgeArticle {
  id           String    @id @default(uuid())
  title        String
  content      String    @db.Text
  category     String    // 'fitness' | 'dance'
  danceStyleId String?   @map("dance_style_id")
  thumbnailUrl String?   @map("thumbnail_url")
  readingTime  Int?      @map("reading_time")
  isPublished  Boolean   @default(false) @map("is_published")
  publishedAt  DateTime? @map("published_at")
  viewCount    Int       @default(0) @map("view_count")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  // Relations
  danceStyle DanceStyle? @relation(fields: [danceStyleId], references: [id])

  @@index([category])
  @@index([isPublished])
  @@index([danceStyleId])
  @@map("knowledge_articles")
}

// ============================================
// USER ACTIVITY
// ============================================

model WatchHistory {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  videoId       String   @map("video_id")
  watchedSeconds Int     @default(0) @map("watched_seconds")
  completed     Boolean  @default(false)
  playbackMode  String   @default("video") @map("playback_mode") // 'video' | 'audio'
  lastWatchedAt DateTime @default(now()) @map("last_watched_at")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  user  User @relation(fields: [userId], references: [id])
  video Video   @relation(fields: [videoId], references: [id])

  @@unique([userId, videoId])
  @@index([userId])
  @@index([videoId])
  @@index([lastWatchedAt])
  @@map("watch_history")
}

model Favorite {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  videoId   String   @map("video_id")
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  user  User @relation(fields: [userId], references: [id])
  video Video   @relation(fields: [videoId], references: [id])

  @@unique([userId, videoId])
  @@index([userId])
  @@index([videoId])
  @@map("favorites")
}

model Notification {
  id        String    @id @default(uuid())
  userId    String    @map("user_id")
  type      String    // 'subscription', 'trial', 'content', 'news', etc.
  title     String
  message   String    @db.Text
  data      Json?     // Additional data
  isRead    Boolean   @default(false) @map("is_read")
  readAt    DateTime? @map("read_at")
  createdAt DateTime  @default(now()) @map("created_at")

  // Relations
  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
  @@index([userId, isRead, createdAt])
  @@map("notifications")
}

// ============================================
// AUTHENTICATION & SECURITY
// ============================================

model RefreshToken {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  token       String    @unique
  expiresAt   DateTime  @map("expires_at")
  isRevoked   Boolean   @default(false) @map("is_revoked")
  revokedAt   DateTime? @map("revoked_at")
  deviceInfo  String?   @map("device_info")
  ipAddress   String?   @map("ip_address")
  createdAt   DateTime  @default(now()) @map("created_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("refresh_tokens")
}

model UserOAuthProvider {
  id              String    @id @default(uuid())
  userId          String    @map("user_id")
  provider        String    // 'google', 'apple'
  providerId      String    @map("provider_id")
  email           String?
  accessToken     String?   @map("access_token")
  refreshToken    String?   @map("refresh_token")
  tokenExpiresAt  DateTime? @map("token_expires_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerId])
  @@index([userId])
  @@index([provider, providerId])
  @@map("user_oauth_providers")
}

// ============================================
// SYSTEM & CONFIGURATION
// ============================================

model SystemSetting {
  id          String   @id @default(uuid())
  key         String   @unique
  value       String?
  type        String   @default("string") // 'string', 'number', 'boolean', 'json'
  category    String?
  description String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([key])
  @@index([category])
  @@map("system_settings")
}

model FileUpload {
  id           String    @id @default(uuid())
  userId       String?   @map("user_id")
  adminId      String?   @map("admin_id")
  fileType     String    @map("file_type")
  fileName     String    @map("file_name")
  fileSize     BigInt?   @map("file_size")
  mimeType     String?   @map("mime_type")
  storageUrl   String    @map("storage_url")
  storageKey   String?   @map("storage_key")
  uploadStatus String    @default("pending") @map("upload_status")
  metadata     Json?
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  // Relations
  user  User?  @relation(fields: [userId], references: [id], onDelete: Cascade)
  admin Admin? @relation(fields: [adminId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([adminId])
  @@index([fileType])
  @@index([uploadStatus])
  @@map("file_uploads")
}

model AuditLog {
  id         String    @id @default(uuid())
  userId     String?   @map("user_id")
  adminId    String?   @map("admin_id")
  action     String
  entityType String?   @map("entity_type")
  entityId   String?   @map("entity_id")
  changes    Json?
  ipAddress  String?   @map("ip_address")
  userAgent  String?   @map("user_agent")
  createdAt  DateTime  @default(now()) @map("created_at")

  // Relations
  user  User?  @relation(fields: [userId], references: [id], onDelete: SetNull)
  admin Admin? @relation(fields: [adminId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([adminId])
  @@index([action])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}

model SearchHistory {
  id           String   @id @default(uuid())
  userId       String?  @map("user_id")
  query        String
  resultsCount Int      @default(0) @map("results_count")
  createdAt    DateTime @default(now()) @map("created_at")

  // Relations
  user User? @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([query])
  @@index([createdAt])
  @@map("search_history")
}
```

---

## 📈 Indexes & Performance

### **Performance Optimization Strategy**

1. **Frequently Queried Fields:**

   - User lookups: `users.email`, `users.phone_number`, `users.is_active`
   - User login: `(email, is_email_verified)`, `(phone_number, is_phone_verified)`
   - Admin lookups: `admins.email`, `admins.admin_role_id`
   - Video filtering: `videos.dance_style_id`, `videos.intensity_level_id`, `videos.is_published`
   - Subscription checks: `subscriptions.user_id`, `subscriptions.status`, `subscriptions.expires_at`
   - Playlist ordering: `playlist_items.playlist_id`, `playlist_items.sort_order`

2. **Composite Indexes:**

   - `(email, is_email_verified)` on users for email login queries
   - `(phone_number, is_phone_verified)` on users for phone login queries
   - `(user_id, status, expires_at)` on subscriptions for active subscription queries
   - `(playlist_id, sort_order)` on playlist_items for ordered retrieval
   - `(user_id, is_read, created_at)` on notifications for unread notifications

3. **Full-Text Search:**

   - PostgreSQL full-text search on `videos.title`, `videos.description`
   - Full-text search on `knowledge_articles.title`, `knowledge_articles.content`

4. **Unique Constraints:**
   - Prevent duplicate ratings: `(user_id, video_id)` on ratings
   - Prevent duplicate favorites: `(user_id, video_id)` on favorites
   - Prevent duplicate playlist items: `(playlist_id, video_id)` on playlist_items

---

## 🌱 Seed Data

### **Initial Seed Data Scripts**

**1. Dance Styles:**

```typescript
const danceStyles = [
  { name: "Zumba Fitness Dance", slug: "zumba-fitness-dance" },
  { name: "Bollywood Dance", slug: "bollywood-dance" },
  { name: "K-pop Fitness Dance", slug: "kpop-fitness-dance" },
  { name: "Dance Choreography", slug: "dance-choreography" },
  { name: "TikTok Dance Basic", slug: "tiktok-dance-basic" },
];
```

**2. Intensity Levels:**

```typescript
const intensityLevels = [
  { name: "Slow & Low Intensity", slug: "slow-low-intensity" },
  { name: "Fast & High Intensity", slug: "fast-high-intensity" },
];
```

**3. Subscription Plans:**

```typescript
const subscriptionPlans = [
  { name: "1 Month", durationMonths: 1, priceMmk: 10000, discountPercent: 0 },
  { name: "3 Months", durationMonths: 3, priceMmk: 27000, discountPercent: 10 },
  { name: "6 Months", durationMonths: 6, priceMmk: 48000, discountPercent: 20 },
  { name: "1 Year", durationMonths: 12, priceMmk: 84000, discountPercent: 30 },
];
```

**4. Admin Roles:**

```typescript
const adminRoles = [
  {
    name: "Super Admin",
    slug: "super_admin",
    description: "Full system access",
    permissions: {
      users: ["create", "read", "update", "delete"],
      admins: ["create", "read", "update", "delete"],
      videos: ["create", "read", "update", "delete"],
      subscriptions: ["create", "read", "update", "delete"],
      analytics: ["read"],
      settings: ["read", "update"],
    },
  },
  {
    name: "Content Manager",
    slug: "content_manager",
    description: "Manage videos and knowledge articles",
    permissions: {
      videos: ["create", "read", "update", "delete"],
      knowledge: ["create", "read", "update", "delete"],
      analytics: ["read"],
    },
  },
  {
    name: "User Manager",
    slug: "user_manager",
    description: "Manage users and subscriptions",
    permissions: {
      users: ["read", "update"],
      subscriptions: ["read", "update"],
      analytics: ["read"],
    },
  },
  {
    name: "Support",
    slug: "support",
    description: "View and respond to user feedback",
    permissions: {
      feedback: ["read", "update"],
      users: ["read"],
    },
  },
  {
    name: "Analytics Viewer",
    slug: "analytics_viewer",
    description: "View analytics only",
    permissions: {
      analytics: ["read"],
    },
  },
];
```

---

## 🔄 Migrations

### **Migration Strategy**

1. **Initial Migration:**

   - Create all tables
   - Add indexes
   - Seed initial data (dance styles, intensity levels, subscription plans)

2. **Future Migrations:**

   - Use Prisma migrations: `npx prisma migrate dev`
   - Always test migrations on staging first
   - Keep migrations reversible

3. **Migration Commands:**

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migration
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

---

## 📝 Next Steps

1. **Review Schema** - Confirm all tables and relationships
2. **Create Prisma Schema File** - Generate `schema.prisma`
3. **Run Initial Migration** - Create database tables
4. **Seed Initial Data** - Populate dance styles, intensity levels, plans
5. **Test Queries** - Verify performance with sample queries

---

**Ready to create the Prisma schema file and seed scripts?**
