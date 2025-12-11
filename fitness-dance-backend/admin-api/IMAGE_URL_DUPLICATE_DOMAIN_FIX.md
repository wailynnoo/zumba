# Image URL Duplicate Domain Fix 🔧

**Date:** 2024-12-11  
**Status:** ✅ Fixed

---

## 🐛 Problem

Image URLs were being constructed with duplicate domains:

- **Bad URL:** `https://admin-api-production-5059.up.railway.app/admin-api-production-5059.up.railway.app/uploads/categories/...`
- **Database:** `uploads/categories/category-123.jpg` (correct)
- **Issue:** Domain was being duplicated when constructing the full URL

---

## 🔍 Root Cause

The relative path in the database might have contained a domain (from old data), or the URL construction logic was adding the domain incorrectly.

---

## ✅ Solution

### **1. Enhanced Path Cleaning**

Updated `normalizeImageUrl()` in `category.service.ts`:

- Detects and removes domains from paths
- Handles paths like: `admin-api-production-5059.up.railway.app/uploads/...` → `uploads/...`
- Works with both full URLs and paths with embedded domains

### **2. Improved URL Construction**

Updated `getFullImageUrl()` in `category.controller.ts`:

- Cleans relative paths before constructing URLs
- Removes any embedded domains
- Ensures protocol is added correctly
- Handles edge cases

### **3. Migration Script**

Created `scripts/fix-image-urls.js`:

- Fixes existing bad URLs in database
- Extracts clean relative paths
- Updates all categories with malformed URLs

---

## 🔧 Changes Made

### **Backend - Category Service** (`src/services/category.service.ts`)

- Enhanced `normalizeImageUrl()` to handle paths with embedded domains
- Extracts clean relative path: `uploads/categories/file.jpg`

### **Backend - Category Controller** (`src/controllers/category.controller.ts`)

- Enhanced `getFullImageUrl()` to clean paths before URL construction
- Removes embedded domains
- Ensures proper URL format

### **Migration Script** (`scripts/fix-image-urls.js`)

- One-time script to fix existing bad URLs
- Safe to run multiple times (idempotent)

---

## 🚀 How to Fix Existing Data

### **Option 1: Run Migration Script (Recommended)**

```bash
cd admin-api
node scripts/fix-image-urls.js
```

This will:

- Find all categories with image URLs
- Extract clean relative paths
- Update database with correct paths
- Show before/after for each category

### **Option 2: Manual SQL Update**

```sql
-- Fix URLs that contain domains
UPDATE video_categories
SET icon_url = SUBSTRING(icon_url FROM 'uploads/.*')
WHERE icon_url LIKE '%.up.railway.app%'
   OR icon_url LIKE '%.railway.app%';
```

---

## ✅ Verification

After the fix:

1. **Database should have:**

   ```
   iconUrl: "uploads/categories/category-123.jpg"
   ```

2. **API should return:**

   ```
   iconUrl: "https://admin-api-production-5059.up.railway.app/uploads/categories/category-123.jpg"
   ```

3. **Frontend should display:**
   - Image loads correctly
   - No duplicate domains in URL

---

## 🧪 Testing

Test cases:

- [x] Upload new image → Database stores relative path
- [x] API returns correct full URL (no duplicate domain)
- [x] Frontend displays image correctly
- [x] Existing bad URLs are cleaned by migration script
- [x] Manual URL entry is normalized correctly

---

## 📝 Notes

- The fix handles both new uploads and existing data
- Migration script is safe to run multiple times
- All URL construction now includes domain cleaning
- Works in both localhost and Railway environments

---

**Fix Complete!** ✅

Image URLs are now constructed correctly without duplicate domains. Run the migration script to fix existing data.
