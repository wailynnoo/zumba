# Prisma Error Handling Implementation ✅

**Date:** 2024-12-06  
**Status:** Implemented

---

## 🔒 Security Issues Addressed

### **Problem:**

- ❌ Generic error responses (400/401/500)
- ❌ Unique constraint violations not properly mapped
- ❌ Foreign key constraint violations not handled
- ❌ Prisma errors not caught and translated to user-friendly messages
- ❌ No centralized error handling

### **Solution:**

- ✅ Centralized error handling middleware
- ✅ Prisma error code mapping to HTTP status codes
- ✅ User-friendly error messages
- ✅ Proper status codes (409 for conflicts, 404 for not found, etc.)
- ✅ Async error wrapper for route handlers

---

## 📋 Error Handling Features

### **1. Prisma Error Code Mapping**

**Error Codes Handled:**

| Prisma Code | HTTP Status               | Description                          |
| ----------- | ------------------------- | ------------------------------------ |
| P2002       | 409 Conflict              | Unique constraint violation          |
| P2003       | 400 Bad Request           | Foreign key constraint violation     |
| P2025       | 404 Not Found             | Record not found                     |
| P2000       | 400 Bad Request           | Value too long                       |
| P2001       | 400 Bad Request           | Record does not exist                |
| P2014       | 400 Bad Request           | Required relation violation          |
| P2015       | 400 Bad Request           | Related record not found             |
| P2016       | 400 Bad Request           | Query interpretation error           |
| P2017       | 400 Bad Request           | Records for relation not connected   |
| P2018       | 400 Bad Request           | Required connected records not found |
| P2019       | 400 Bad Request           | Input error                          |
| P2020       | 400 Bad Request           | Value out of range                   |
| P2021       | 500 Internal Server Error | Table does not exist                 |
| P2022       | 500 Internal Server Error | Column does not exist                |
| P2023       | 500 Internal Server Error | Inconsistent column data             |
| P2024       | 503 Service Unavailable   | Connection timeout                   |
| P2026       | 501 Not Implemented       | Unsupported feature                  |
| P2027       | 400 Bad Request           | Multiple errors                      |

---

### **2. User-Friendly Error Messages**

**Unique Constraint Violation (P2002):**

```json
{
  "success": false,
  "message": "Slug already exists. Please use a different slug.",
  "error": {
    "code": "P2002",
    "meta": { "target": ["slug"] }
  }
}
```

**Foreign Key Constraint Violation (P2003):**

```json
{
  "success": false,
  "message": "Cannot perform this operation because it would violate a foreign key constraint. The category_id does not exist or is referenced by other records.",
  "error": {
    "code": "P2003",
    "meta": { "field_name": "category_id" }
  }
}
```

**Record Not Found (P2025):**

```json
{
  "success": false,
  "message": "The requested record was not found.",
  "error": {
    "code": "P2025"
  }
}
```

---

### **3. Error Types Handled**

#### **Prisma Errors:**

- `PrismaClientKnownRequestError` - Known database errors
- `PrismaClientValidationError` - Validation errors
- `PrismaClientInitializationError` - Database connection errors
- `PrismaClientUnknownRequestError` - Unknown database errors

#### **Validation Errors:**

- `ZodError` - Zod schema validation errors

#### **Custom Errors:**

- `AppError` - Custom application errors with status codes

#### **Generic Errors:**

- All other errors fall back to 500 Internal Server Error

---

## 📁 Files Created/Modified

### **Admin API:**

1. **`admin-api/src/middleware/error.middleware.ts`** (NEW)

   - Centralized error handling
   - Prisma error mapping
   - User-friendly messages
   - Async error wrapper

2. **`admin-api/src/app.ts`** (UPDATED)
   - Replaced generic error handler with centralized middleware

### **Member API:**

1. **`member-api/src/middleware/error.middleware.ts`** (NEW)

   - Centralized error handling
   - Prisma error mapping
   - User-friendly messages
   - Async error wrapper

2. **`member-api/src/app.ts`** (UPDATED)
   - Replaced generic error handler with centralized middleware

---

## 🔧 Usage Examples

### **Before (Generic Error Handling):**

```typescript
// Controller
async createCategory(req: Request, res: Response): Promise<void> {
  try {
    const category = await categoryService.createCategory(data);
    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create category",
    });
  }
}
```

**Problem:** Prisma unique constraint errors return generic 400 with technical message.

### **After (Centralized Error Handling):**

```typescript
// Controller - Errors automatically caught by middleware
async createCategory(req: Request, res: Response): Promise<void> {
  const category = await categoryService.createCategory(data);
  res.status(201).json({ success: true, data: category });
  // Prisma errors automatically handled by error middleware
}
```

**Result:** Prisma unique constraint errors return 409 Conflict with user-friendly message.

---

## 🎯 Error Response Format

### **Success Response:**

```json
{
  "success": true,
  "message": "Category created successfully",
  "data": { ... }
}
```

### **Error Response (Production):**

```json
{
  "success": false,
  "message": "Slug already exists. Please use a different slug."
}
```

### **Error Response (Development):**

```json
{
  "success": false,
  "message": "Slug already exists. Please use a different slug.",
  "error": {
    "code": "P2002",
    "meta": {
      "target": ["slug"]
    }
  }
}
```

---

## 🧪 Testing Error Handling

### **Test Unique Constraint Violation:**

```bash
# Create category with duplicate slug
curl -X POST http://localhost:3002/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Test","slug":"existing-slug"}'

# Response: 409 Conflict
{
  "success": false,
  "message": "Slug already exists. Please use a different slug."
}
```

### **Test Foreign Key Constraint:**

```bash
# Try to create record with invalid foreign key
curl -X POST http://localhost:3002/api/videos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"categoryId":"invalid-id",...}'

# Response: 400 Bad Request
{
  "success": false,
  "message": "Cannot perform this operation because it would violate a foreign key constraint..."
}
```

### **Test Record Not Found:**

```bash
# Get non-existent category
curl http://localhost:3002/api/categories/invalid-id \
  -H "Authorization: Bearer <token>"

# Response: 404 Not Found
{
  "success": false,
  "message": "The requested record was not found."
}
```

---

## 📊 Error Code Mapping Details

### **P2002 - Unique Constraint Violation**

**When it occurs:**

- Creating a record with duplicate unique field (slug, email, etc.)
- Updating a record to a value that already exists

**HTTP Status:** 409 Conflict

**Message Format:**

- Extracts field name from `meta.target`
- Returns: `"{Field} already exists. Please use a different {field}."`

**Example:**

```typescript
// If slug "workout" already exists
{
  "success": false,
  "message": "Slug already exists. Please use a different slug."
}
```

### **P2003 - Foreign Key Constraint Violation**

**When it occurs:**

- Referencing a non-existent foreign key
- Deleting a record that is referenced by other records

**HTTP Status:** 400 Bad Request

**Message Format:**

- Extracts field name from `meta.field_name`
- Returns descriptive message about the constraint violation

### **P2025 - Record Not Found**

**When it occurs:**

- Updating a non-existent record
- Deleting a non-existent record
- Using `update` or `delete` on a record that doesn't exist

**HTTP Status:** 404 Not Found

**Message:** "The requested record was not found."

---

## 🔄 Migration Guide

### **Updating Controllers:**

**Before:**

```typescript
async createCategory(req: Request, res: Response): Promise<void> {
  try {
    // ... logic
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ ... });
      return;
    }
    res.status(400).json({ ... });
  }
}
```

**After:**

```typescript
async createCategory(req: Request, res: Response): Promise<void> {
  // Zod errors still need to be caught if using parse()
  // But Prisma errors are automatically handled
  const validated = createCategorySchema.parse(req.body);
  const category = await categoryService.createCategory(validated);
  res.status(201).json({ success: true, data: category });
}
```

**Note:** Controllers can still catch Zod errors for custom formatting, but Prisma errors will be automatically handled by the middleware.

---

## ⚙️ Configuration

### **Environment Variables:**

Error details are only shown in development:

```typescript
// Development
{
  "success": false,
  "message": "...",
  "error": { "code": "P2002", "meta": {...} }
}

// Production
{
  "success": false,
  "message": "..."
}
```

---

## 🚀 Best Practices

### **1. Use AppError for Custom Errors:**

```typescript
import { AppError } from "../middleware/error.middleware";

if (!category) {
  throw new AppError("Category not found", 404);
}
```

### **2. Let Prisma Errors Bubble Up:**

```typescript
// Don't catch Prisma errors in services
// Let them bubble up to the error middleware
async createCategory(data) {
  // This will throw PrismaClientKnownRequestError if slug exists
  return await prisma.videoCategory.create({ data });
}
```

### **3. Use Async Handler (Optional):**

```typescript
import { asyncHandler } from "../middleware/error.middleware";

router.post(
  "/",
  asyncHandler(async (req, res) => {
    // Errors automatically caught and passed to error middleware
    const result = await someAsyncOperation();
    res.json({ success: true, data: result });
  })
);
```

---

## 📚 Related Documentation

- [Prisma Error Codes](https://www.prisma.io/docs/reference/api-reference/error-reference)
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)

---

**Status:** ✅ Centralized Prisma error handling implemented and configured.
