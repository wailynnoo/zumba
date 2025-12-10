# RBAC (Role-Based Access Control) Implementation ✅

**Date:** 2024-12-06  
**Status:** Implemented

---

## 🔒 Security Issue Addressed

### **Problem:**
- ❌ Routes only protected by authentication
- ❌ All authenticated admins could perform any action
- ❌ `requirePermission` and `requireRole` helpers existed but were never used
- ❌ No granular access control

### **Solution:**
- ✅ RBAC middleware applied to all category routes
- ✅ Permission-based access control enforced
- ✅ Role-based restrictions implemented
- ✅ Super admin bypass for full access

---

## 📋 Permission Structure

### **Permission Format:**
```typescript
{
  resource: string,  // e.g., "categories", "videos", "users"
  action: string    // e.g., "create", "read", "update", "delete"
}
```

### **Available Resources:**
- `categories` - Video category management
- `videos` - Video content management
- `users` - User management
- `admins` - Admin user management
- `subscriptions` - Subscription management
- `knowledge` - Knowledge articles
- `feedback` - User feedback
- `analytics` - Analytics viewing
- `settings` - System settings

### **Available Actions:**
- `create` - Create new records
- `read` - View/list records
- `update` - Modify existing records
- `delete` - Delete records

---

## 👥 Admin Roles & Permissions

### **1. Super Admin** (`super_admin`)
**Description:** Full system access with all permissions

**Permissions:**
```json
{
  "users": ["create", "read", "update", "delete"],
  "admins": ["create", "read", "update", "delete"],
  "videos": ["create", "read", "update", "delete"],
  "categories": ["create", "read", "update", "delete"],
  "subscriptions": ["create", "read", "update", "delete"],
  "analytics": ["read"],
  "settings": ["read", "update"],
  "knowledge": ["create", "read", "update", "delete"],
  "feedback": ["read", "update", "delete"]
}
```

**Access:** ✅ All operations on all resources

---

### **2. Content Manager** (`content_manager`)
**Description:** Manage videos, categories, and knowledge articles

**Permissions:**
```json
{
  "videos": ["create", "read", "update", "delete"],
  "categories": ["create", "read", "update", "delete"],
  "knowledge": ["create", "read", "update", "delete"],
  "analytics": ["read"]
}
```

**Access:**
- ✅ Full CRUD on videos, categories, knowledge
- ✅ Read analytics
- ❌ No access to users, admins, subscriptions, settings

---

### **3. User Manager** (`user_manager`)
**Description:** Manage users and subscriptions

**Permissions:**
```json
{
  "users": ["read", "update"],
  "subscriptions": ["read", "update"],
  "analytics": ["read"],
  "categories": ["read"]
}
```

**Access:**
- ✅ Read/update users and subscriptions
- ✅ Read categories (view-only)
- ✅ Read analytics
- ❌ No create/delete permissions
- ❌ No access to videos, knowledge, settings

---

### **4. Support** (`support`)
**Description:** View and respond to user feedback

**Permissions:**
```json
{
  "feedback": ["read", "update"],
  "users": ["read"],
  "categories": ["read"]
}
```

**Access:**
- ✅ Read/update feedback
- ✅ Read users (view-only)
- ✅ Read categories (view-only)
- ❌ No create/delete permissions
- ❌ No access to videos, subscriptions, settings

---

## 🛡️ RBAC Middleware

### **1. `requirePermission(resource, action)`**

**Usage:**
```typescript
router.post("/", 
  authenticate,
  requirePermission("categories", "create"),
  controller.create
);
```

**How it works:**
1. Checks if admin is authenticated
2. Verifies admin has permissions object
3. Super admin bypasses all checks
4. Checks if resource exists in permissions
5. Checks if action is allowed for resource
6. Returns 403 if permission denied

**Example:**
```typescript
// Only admins with "create" permission on "categories" can access
router.post("/", 
  authenticate,
  requirePermission("categories", "create"),
  categoryController.createCategory
);
```

### **2. `requireRole(...roleSlugs)`**

**Usage:**
```typescript
router.delete("/:id",
  authenticate,
  requireRole("super_admin", "content_manager"),
  controller.delete
);
```

**How it works:**
1. Checks if admin is authenticated
2. Verifies admin's role slug matches one of the required roles
3. Returns 403 if role doesn't match

**Example:**
```typescript
// Only super_admin or content_manager can delete
router.delete("/:id",
  authenticate,
  requireRole("super_admin", "content_manager"),
  categoryController.deleteCategory
);
```

---

## 📝 Category Routes with RBAC

### **Before (No RBAC):**
```typescript
router.use(authenticate); // Only authentication
router.post("/", categoryController.createCategory);
router.get("/", categoryController.getCategories);
// ... all routes accessible to any authenticated admin
```

### **After (With RBAC):**
```typescript
router.use(authenticate); // Authentication required

// Create - requires 'create' permission
router.post("/", 
  requirePermission("categories", "create"),
  categoryController.createCategory
);

// List - requires 'read' permission
router.get("/", 
  requirePermission("categories", "read"),
  categoryController.getCategories
);

// Update - requires 'update' permission
router.put("/:id", 
  requirePermission("categories", "update"),
  categoryController.updateCategory
);

// Delete - requires 'delete' permission
router.delete("/:id", 
  requirePermission("categories", "delete"),
  categoryController.deleteCategory
);
```

---

## 🔄 Updating Existing Roles

### **Option 1: Run Seed Script (Development)**
```bash
cd fitness-dance-backend
npx tsx prisma/seed.ts
```

This will update all roles with categories permissions.

### **Option 2: Run Update Script (Production)**
```bash
cd fitness-dance-backend
npx ts-node admin-api/scripts/update-roles-categories-permissions.ts
```

This script updates existing roles without recreating them.

### **Option 3: Manual Database Update**
```sql
-- Update Super Admin
UPDATE admin_roles 
SET permissions = jsonb_set(
  permissions::jsonb, 
  '{categories}', 
  '["create", "read", "update", "delete"]'::jsonb
)
WHERE slug = 'super_admin';

-- Update Content Manager
UPDATE admin_roles 
SET permissions = jsonb_set(
  permissions::jsonb, 
  '{categories}', 
  '["create", "read", "update", "delete"]'::jsonb
)
WHERE slug = 'content_manager';

-- Update User Manager
UPDATE admin_roles 
SET permissions = jsonb_set(
  permissions::jsonb, 
  '{categories}', 
  '["read"]'::jsonb
)
WHERE slug = 'user_manager';

-- Update Support
UPDATE admin_roles 
SET permissions = jsonb_set(
  permissions::jsonb, 
  '{categories}', 
  '["read"]'::jsonb
)
WHERE slug = 'support';
```

---

## 🧪 Testing RBAC

### **Test Cases:**

1. **Super Admin:**
   - ✅ Can create categories
   - ✅ Can read categories
   - ✅ Can update categories
   - ✅ Can delete categories

2. **Content Manager:**
   - ✅ Can create categories
   - ✅ Can read categories
   - ✅ Can update categories
   - ✅ Can delete categories

3. **User Manager:**
   - ❌ Cannot create categories (403 Forbidden)
   - ✅ Can read categories
   - ❌ Cannot update categories (403 Forbidden)
   - ❌ Cannot delete categories (403 Forbidden)

4. **Support:**
   - ❌ Cannot create categories (403 Forbidden)
   - ✅ Can read categories
   - ❌ Cannot update categories (403 Forbidden)
   - ❌ Cannot delete categories (403 Forbidden)

### **Test Commands:**

```bash
# Test as Content Manager (should succeed)
curl -X POST http://localhost:3002/api/categories \
  -H "Authorization: Bearer <content_manager_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Category", "slug": "test-category"}'

# Test as Support (should fail with 403)
curl -X POST http://localhost:3002/api/categories \
  -H "Authorization: Bearer <support_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Category", "slug": "test-category"}'
```

---

## 📊 Permission Matrix

| Role | Categories Create | Categories Read | Categories Update | Categories Delete |
|------|------------------|----------------|-------------------|-------------------|
| Super Admin | ✅ | ✅ | ✅ | ✅ |
| Content Manager | ✅ | ✅ | ✅ | ✅ |
| User Manager | ❌ | ✅ | ❌ | ❌ |
| Support | ❌ | ✅ | ❌ | ❌ |

---

## 🚀 Next Steps

### **Apply RBAC to Other Resources:**

When adding new resources, follow this pattern:

1. **Add permissions to seed data:**
   ```typescript
   permissions: {
     new_resource: ["create", "read", "update", "delete"],
   }
   ```

2. **Apply middleware to routes:**
   ```typescript
   router.post("/", 
     authenticate,
     requirePermission("new_resource", "create"),
     controller.create
   );
   ```

3. **Update existing roles:**
   - Run update script or seed script
   - Or manually update database

### **Resources to Protect:**
- [ ] Videos (when implemented)
- [ ] Users (when implemented)
- [ ] Subscriptions (when implemented)
- [ ] Knowledge Articles (when implemented)
- [ ] Feedback (when implemented)
- [ ] Settings (when implemented)

---

## ⚠️ Important Notes

### **Super Admin Bypass:**
- Super admins (`roleSlug === "super_admin"`) bypass all permission checks
- This is intentional for system administration
- Use super admin role carefully

### **Permission Structure:**
- Permissions stored as JSON in `admin_roles.permissions`
- Structure: `{ resource: [actions] }`
- Actions are case-sensitive: `"create"`, `"read"`, `"update"`, `"delete"`

### **Error Responses:**
- **401 Unauthorized:** Not authenticated or token invalid
- **403 Forbidden:** Authenticated but lacks required permission
- **404 Not Found:** Resource doesn't exist

---

## 📚 Related Files

- `src/middleware/auth.middleware.ts` - RBAC middleware
- `src/routes/category.routes.ts` - Category routes with RBAC
- `prisma/seed.ts` - Role permissions seed data
- `scripts/update-roles-categories-permissions.ts` - Update script

---

**Status:** ✅ RBAC implemented and enforced on category routes.

