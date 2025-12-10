# User Table Updates ✅

**Updated all user-related code to include profile fields**

---

## ✅ What Was Fixed

### **1. AuthRequest Interface**

**Updated to include all profile fields:**

```typescript
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email?: string;
    phoneNumber?: string;
    displayName?: string; // ✅ Added
    avatarUrl?: string; // ✅ Added
    dateOfBirth?: Date; // ✅ Added
    address?: string; // ✅ Added
    weight?: number; // ✅ Added
  };
}
```

---

### **2. Authentication Middleware**

**Updated `authenticate()` function:**

- ✅ Now selects all profile fields from database
- ✅ Attaches all profile fields to `req.user`
- ✅ Includes: displayName, avatarUrl, dateOfBirth, address, weight

**Updated `optionalAuthenticate()` function:**

- ✅ Same updates as authenticate()

---

### **3. Login Response**

**Updated login response to include all profile fields:**

```typescript
{
  user: {
    id: string;
    email: string | null;
    phoneNumber: string | null;
    displayName: string | null;      // ✅ Added
    avatarUrl: string | null;         // ✅ Added
    dateOfBirth: Date | null;         // ✅ Added
    age: number | undefined;          // ✅ Calculated
    address: string | null;            // ✅ Added
    weight: number | null;             // ✅ Added
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
  },
  tokens: {...}
}
```

---

### **4. Database Indexes**

**Added indexes for better query performance:**

- ✅ `@@index([displayName])` - For name searches
- ✅ `@@index([deletedAt])` - For soft delete queries

---

## 📋 Complete User Profile Fields

### **Available in `req.user` (after authentication):**

1. ✅ `userId` - User ID
2. ✅ `email` - Email address
3. ✅ `phoneNumber` - Phone number
4. ✅ `displayName` - User's name
5. ✅ `avatarUrl` - Profile picture URL
6. ✅ `dateOfBirth` - Date of birth
7. ✅ `address` - User address
8. ✅ `weight` - User weight (kg)

### **Available in Login/Register Response:**

- All above fields PLUS:
- ✅ `age` - Calculated from dateOfBirth
- ✅ `isEmailVerified` - Email verification status
- ✅ `isPhoneVerified` - Phone verification status

---

## 🎯 Usage Examples

### **Access User Profile in Routes:**

```typescript
import { AuthRequest } from "../middleware/auth.middleware";

router.get("/profile", authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user; // All profile fields available!

  res.json({
    name: user?.displayName,
    email: user?.email,
    phone: user?.phoneNumber,
    avatar: user?.avatarUrl,
    age: user?.dateOfBirth ? calculateAge(user.dateOfBirth) : undefined,
    address: user?.address,
    weight: user?.weight,
  });
});
```

---

## ✅ Summary

**All user-related code now includes:**

- ✅ Profile picture (avatarUrl)
- ✅ Name (displayName)
- ✅ Age (calculated from dateOfBirth)
- ✅ Address
- ✅ Weight
- ✅ Phone (phoneNumber)
- ✅ Email

**Updated files:**

1. ✅ `src/middleware/auth.middleware.ts` - AuthRequest interface & middleware
2. ✅ `src/services/auth.service.ts` - Login response
3. ✅ `prisma/schema.prisma` - Added indexes

---

**User table updates complete!** ✅
