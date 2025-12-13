# Admin API - Next Steps Roadmap 🚀

**Last Updated:** 2024-12-06  
**Status:** Planning Phase

---

## 📊 Current Implementation Status

### ✅ **Completed Features**

1. **Authentication System**

   - ✅ Admin login (email/password)
   - ✅ JWT access tokens (30min expiry)
   - ✅ JWT refresh tokens (7 days expiry)
   - ✅ Token refresh endpoint
   - ✅ Authentication middleware
   - ✅ RBAC (Role-Based Access Control) middleware

2. **Category Management**

   - ✅ Full CRUD operations
   - ✅ Pagination, search, filtering
   - ✅ Soft delete with safety checks
   - ✅ Slug generation & validation
   - ✅ RBAC protection

3. **Infrastructure**
   - ✅ Express app setup
   - ✅ Prisma ORM integration
   - ✅ Validation middleware (Zod)
   - ✅ Security middleware (Helmet, CORS, rate limiting)
   - ✅ Error handling middleware
   - ✅ TypeScript configuration

---

## 🎯 Priority Next Steps

### **1. Category Image Upload** 📸 (HIGH PRIORITY)

**Status:** Discussion document created, implementation pending

**Why:** Frontend needs to upload category images (as shown in the screenshot)

**Tasks:**

- [ ] Install `multer` for file upload handling
- [ ] Create file upload middleware
- [ ] Create file upload service
- [ ] Add image upload endpoint: `POST /api/categories/:id/image`
- [ ] Add image update endpoint: `PUT /api/categories/:id/image`
- [ ] Add image delete endpoint: `DELETE /api/categories/:id/image`
- [ ] Decide on storage strategy (local filesystem vs cloud storage)
- [ ] Implement image validation (type, size)
- [ ] Optional: Image processing (resize, optimize)

**Files to Create:**

- `src/middleware/upload.middleware.ts`
- `src/services/file-upload.service.ts`
- Update `src/routes/category.routes.ts`
- Update `src/controllers/category.controller.ts`

**Estimated Time:** 4-6 hours

---

### **2. Video Management** 🎥 (CRITICAL PRIORITY)

**Status:** Not started

**Why:** This is a video streaming app - videos are the core content!

**Database Model:** `Video` (already exists in schema)

**Tasks:**

- [ ] Create `src/services/video.service.ts`
- [ ] Create `src/controllers/video.controller.ts`
- [ ] Create `src/routes/video.routes.ts`
- [ ] Implement CRUD operations:
  - [ ] Create video (with validation)
  - [ ] List videos (pagination, search, filters)
  - [ ] Get video by ID
  - [ ] Update video
  - [ ] Delete video (soft delete)
  - [ ] Toggle video status
- [ ] Add video upload endpoint (for video files)
- [ ] Add thumbnail upload endpoint
- [ ] Link videos to categories/subcategories
- [ ] Add RBAC protection

**Key Features Needed:**

- Video metadata (title, description, duration, file URL)
- Category/subcategory relationships
- Dance style and intensity level
- Video file upload/storage
- Thumbnail image upload
- Search and filtering (by category, style, intensity, etc.)

**Files to Create:**

- `src/services/video.service.ts`
- `src/controllers/video.controller.ts`
- `src/routes/video.routes.ts`

**Estimated Time:** 8-12 hours

---

### **3. Video Subcategory Management** 📁 (MEDIUM PRIORITY)

**Status:** Not started

**Why:** Categories have subcategories - need to manage them

**Database Model:** `VideoSubcategory` (already exists in schema)

**Tasks:**

- [ ] Create `src/services/subcategory.service.ts`
- [ ] Create `src/controllers/subcategory.controller.ts`
- [ ] Create `src/routes/subcategory.routes.ts`
- [ ] Implement CRUD operations
- [ ] Link subcategories to parent categories
- [ ] Add RBAC protection

**Estimated Time:** 4-6 hours

---

### **4. Video Collection Management** 📚 (MEDIUM PRIORITY)

**Status:** Not started

**Why:** Collections group related videos together

**Database Model:** `VideoCollection` (already exists in schema)

**Tasks:**

- [ ] Create `src/services/collection.service.ts`
- [ ] Create `src/controllers/collection.controller.ts`
- [ ] Create `src/routes/collection.routes.ts`
- [ ] Implement CRUD operations
- [ ] Add/remove videos from collections
- [ ] Add RBAC protection

**Estimated Time:** 4-6 hours

---

### **5. User Management** 👥 (MEDIUM PRIORITY)

**Status:** Not started

**Why:** Admins need to view and manage users

**Database Model:** `User` (already exists in schema)

**Tasks:**

- [ ] Create `src/services/user.service.ts`
- [ ] Create `src/controllers/user.controller.ts`
- [ ] Create `src/routes/user.routes.ts`
- [ ] Implement read operations (list, get by ID)
- [ ] Implement update operations (activate/deactivate, update profile)
- [ ] Add user search and filtering
- [ ] Add RBAC protection (read-only for most roles)
- [ ] Optional: User statistics/analytics

**Note:** User creation should be handled by member-api (registration), not admin-api

**Estimated Time:** 6-8 hours

---

### **6. Subscription Management** 💳 (MEDIUM PRIORITY)

**Status:** Not started

**Why:** Admins need to manage subscription plans and user subscriptions

**Database Models:** `SubscriptionPlan`, `Subscription` (already exist in schema)

**Tasks:**

- [ ] Create `src/services/subscription-plan.service.ts`
- [ ] Create `src/services/subscription.service.ts`
- [ ] Create `src/controllers/subscription.controller.ts`
- [ ] Create `src/routes/subscription.routes.ts`
- [ ] Implement subscription plan CRUD
- [ ] Implement subscription management (view, update, cancel)
- [ ] Add RBAC protection

**Estimated Time:** 6-8 hours

---

### **7. Knowledge Article Management** 📖 (LOW PRIORITY)

**Status:** Not started

**Why:** Help articles and knowledge base content

**Database Model:** `KnowledgeArticle` (already exists in schema)

**Tasks:**

- [ ] Create `src/services/knowledge.service.ts`
- [ ] Create `src/controllers/knowledge.controller.ts`
- [ ] Create `src/routes/knowledge.routes.ts`
- [ ] Implement CRUD operations
- [ ] Add RBAC protection

**Estimated Time:** 4-6 hours

---

### **8. Feedback Management** 💬 (LOW PRIORITY)

**Status:** Not started

**Why:** Admins need to view and respond to user feedback

**Database Model:** `Feedback` (already exists in schema)

**Tasks:**

- [ ] Create `src/services/feedback.service.ts`
- [ ] Create `src/controllers/feedback.controller.ts`
- [ ] Create `src/routes/feedback.routes.ts`
- [ ] Implement read operations (list, get by ID)
- [ ] Implement update operations (mark as read, respond)
- [ ] Add filtering (by status, date, user)
- [ ] Add RBAC protection

**Estimated Time:** 4-6 hours

---

### **9. System Settings Management** ⚙️ (MEDIUM PRIORITY)

**Status:** Not started

**Why:** Admins need to manage system-wide settings

**Database Model:** `SystemSetting` (already exists in schema)

**Tasks:**

- [ ] Create `src/services/settings.service.ts`
- [ ] Create `src/controllers/settings.controller.ts`
- [ ] Create `src/routes/settings.routes.ts`
- [ ] Implement read operations (get all, get by key)
- [ ] Implement update operations (update setting value)
- [ ] Add validation for setting types
- [ ] Add RBAC protection (only super admin)

**Estimated Time:** 3-4 hours

---

### **10. Analytics/Dashboard Endpoints** 📊 (LOW PRIORITY)

**Status:** Not started

**Why:** Admins need insights into app usage

**Tasks:**

- [ ] Create `src/services/analytics.service.ts`
- [ ] Create `src/controllers/analytics.controller.ts`
- [ ] Create `src/routes/analytics.routes.ts`
- [ ] Implement statistics endpoints:
  - [ ] Total users, active users
  - [ ] Total videos, views
  - [ ] Subscription statistics
  - [ ] Revenue statistics
  - [ ] User growth over time
- [ ] Add RBAC protection (read-only)

**Estimated Time:** 6-8 hours

---

## 🏗️ Infrastructure Improvements

### **1. File Upload System** 📤

**Status:** Not started

**Why:** Needed for category images, video files, thumbnails, etc.

**Tasks:**

- [ ] Install `multer` package
- [ ] Create upload middleware
- [ ] Create file upload service
- [ ] Decide on storage strategy:
  - Option A: Local filesystem (quick start)
  - Option B: Cloud storage (Cloudflare R2, AWS S3, Railway Volumes)
- [ ] Implement file validation
- [ ] Implement file deletion
- [ ] Optional: Image processing (sharp library)

**Files to Create:**

- `src/middleware/upload.middleware.ts`
- `src/services/file-upload.service.ts`
- `src/utils/image-processor.ts` (optional)

**Estimated Time:** 4-6 hours

---

### **2. Admin Management** 👨‍💼 (MEDIUM PRIORITY)

**Status:** Not started

**Why:** Super admins need to manage other admins

**Database Model:** `Admin`, `AdminRole` (already exist in schema)

**Tasks:**

- [ ] Create `src/services/admin.service.ts`
- [ ] Create `src/controllers/admin.controller.ts`
- [ ] Create `src/routes/admin.routes.ts`
- [ ] Implement CRUD operations (create, read, update, delete)
- [ ] Implement role assignment
- [ ] Add RBAC protection (only super admin)
- [ ] Add password reset functionality

**Estimated Time:** 6-8 hours

---

### **3. Audit Logging** 📝 (LOW PRIORITY)

**Status:** Not started

**Why:** Track admin actions for security and debugging

**Database Model:** `AuditLog` (already exists in schema)

**Tasks:**

- [ ] Create audit logging middleware
- [ ] Log all admin actions (create, update, delete)
- [ ] Create `src/services/audit.service.ts`
- [ ] Create `src/controllers/audit.controller.ts`
- [ ] Create `src/routes/audit.routes.ts`
- [ ] Implement audit log viewing (with filters)

**Estimated Time:** 4-6 hours

---

## 📋 Recommended Implementation Order

### **Phase 1: Core Content Management** (Week 1-2)

1. ✅ Category Image Upload
2. ✅ Video Management (CRUD)
3. ✅ Video Subcategory Management
4. ✅ Video Collection Management

### **Phase 2: User & Business Management** (Week 3-4)

5. ✅ User Management
6. ✅ Subscription Management
7. ✅ System Settings

### **Phase 3: Additional Features** (Week 5+)

8. ✅ Knowledge Articles
9. ✅ Feedback Management
10. ✅ Analytics/Dashboard
11. ✅ Admin Management
12. ✅ Audit Logging

---

## 🔧 Technical Debt & Improvements

### **1. Testing**

- [ ] Add unit tests for services
- [ ] Add integration tests for API endpoints
- [ ] Add E2E tests for critical flows

### **2. Documentation**

- [ ] API documentation (Swagger/OpenAPI)
- [ ] Update README with all endpoints
- [ ] Add code comments for complex logic

### **3. Performance**

- [ ] Add caching for frequently accessed data
- [ ] Optimize database queries
- [ ] Add pagination to all list endpoints

### **4. Error Handling**

- [ ] Standardize error responses
- [ ] Add error logging
- [ ] Improve error messages

---

## 🎯 Immediate Next Steps (This Week)

1. **Implement Category Image Upload** (4-6 hours)

   - This is blocking the frontend feature
   - Start with local filesystem storage
   - Can migrate to cloud storage later

2. **Start Video Management** (8-12 hours)
   - This is the core feature of the app
   - Implement basic CRUD first
   - Add file upload later

---

## 📝 Notes

- All new routes should follow the existing pattern:
  - Route → Middleware (auth, RBAC) → Controller → Service → Database
- Use Zod for validation
- Apply RBAC protection to all routes
- Use soft delete pattern where appropriate
- Follow TypeScript best practices
- Maintain consistent error handling

---

**Last Updated:** 2024-12-06
