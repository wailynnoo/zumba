# Deployment Update Guide

**Date:** 2024-12-06  
**Purpose:** Update server with latest security improvements

---

## 🔄 Changes Summary

### **1. Database Migrations**

- ✅ `20241206120000_add_refresh_token_security` - Adds `admin_refresh_tokens` table and updates `refresh_tokens` table

### **2. Security Improvements**

- ✅ JWT tokens now include `iss` (issuer) and `aud` (audience) claims
- ✅ Refresh token expiry now uses validated environment variables
- ✅ Relationship checker now uses transaction client for consistency

---

## 📋 Deployment Steps

### **Step 1: Backup Database**

```bash
# Create a backup before running migrations
pg_dump -h <host> -U <user> -d <database> > backup_$(date +%Y%m%d_%H%M%S).sql
```

### **Step 2: Run Database Migrations**

```bash
cd fitness-dance-backend
npx prisma migrate deploy
```

This will apply the `20241206120000_add_refresh_token_security` migration if it hasn't been applied yet.

### **Step 3: Regenerate Prisma Client**

```bash
# From root directory
npx prisma generate --schema=prisma/schema.prisma
```

### **Step 4: Update Environment Variables**

Add these new environment variables to your `.env` files:

**Admin-API `.env`:**

```env
# JWT Issuer and Audience (optional - defaults provided)
JWT_ISSUER=fitness-dance-admin-api
JWT_AUDIENCE=fitness-dance-admin
```

**Member-API `.env`:**

```env
# JWT Issuer and Audience (optional - defaults provided)
JWT_ISSUER=fitness-dance-member-api
JWT_AUDIENCE=fitness-dance-member
```

**Note:** These have sensible defaults, so they're optional. But it's recommended to set them explicitly for production.

### **Step 5: Restart Services**

Restart both API services to pick up the new code:

```bash
# Admin API
cd admin-api
npm run build
npm start

# Member API
cd member-api
npm run build
npm start
```

---

## ✅ Verification

### **1. Check Migration Status**

```bash
npx prisma migrate status
```

Should show all migrations as applied.

### **2. Verify Database Tables**

```sql
-- Check if admin_refresh_tokens table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'admin_refresh_tokens';

-- Check if refresh_tokens has token_hash column
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'refresh_tokens'
AND column_name = 'token_hash';
```

### **3. Test JWT Tokens**

After deployment, test that:

- ✅ Login generates tokens with `iss` and `aud` claims
- ✅ Token verification validates `iss` and `aud`
- ✅ Refresh tokens work correctly
- ✅ Logout revokes refresh tokens

---

## 🔍 Migration Details

### **Migration: `20241206120000_add_refresh_token_security`**

**Creates:**

- `admin_refresh_tokens` table with:
  - `id`, `admin_id`, `token_hash` (unique)
  - `expires_at`, `is_revoked`, `revoked_at`
  - `device_info`, `ip_address`, `user_agent`
  - Foreign key to `admins` table with CASCADE delete

**Updates:**

- `refresh_tokens` table:
  - Renames `token` column to `token_hash`
  - Adds `user_agent` column
  - Updates indexes

---

## ⚠️ Important Notes

1. **Existing Tokens:** Old tokens without `iss`/`aud` will be rejected after deployment. Users will need to log in again.

2. **Token Expiry:** Refresh token expiry now uses `JWT_REFRESH_EXPIRES_IN` environment variable instead of hardcoded 7 days.

3. **No Seed Changes:** The seed script doesn't need updates - refresh tokens are created during login, not seeded.

4. **Backward Compatibility:** The new JWT claims have defaults, so the system will work even if environment variables aren't set (but it's recommended to set them).

---

## 🚨 Rollback Plan

If you need to rollback:

1. **Revert Code:** Checkout previous commit
2. **Database:** The migration is additive (adds new table, renames column), so no data loss
3. **Restart Services:** Restart with old code

**Note:** Rolling back will mean:

- Old tokens without `iss`/`aud` will work again
- But new security features will be lost

---

## 📝 Post-Deployment Checklist

- [ ] All migrations applied successfully
- [ ] Prisma client regenerated
- [ ] Environment variables updated
- [ ] Services restarted
- [ ] Login flow tested
- [ ] Token refresh tested
- [ ] Logout tested
- [ ] Database tables verified

---

**Status:** ✅ Ready for deployment
