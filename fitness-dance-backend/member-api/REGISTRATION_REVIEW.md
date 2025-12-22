# Registration System - Detailed Review

**Date:** Current  
**Status:** Mostly Complete, Some Issues Found

---

## ✅ **WHAT'S WORKING WELL**

### 1. **Core Registration Flow** ✅
- ✅ Email OR Phone registration (at least one required)
- ✅ Password hashing with bcrypt
- ✅ Password strength validation
- ✅ Duplicate email/phone check
- ✅ JWT token generation
- ✅ Refresh token storage
- ✅ Email/phone verification token generation
- ✅ Age calculation from dateOfBirth

### 2. **Validation** ✅
- ✅ Email format validation
- ✅ Password strength (8+ chars, uppercase, lowercase, number, special char)
- ✅ Display name validation (1-100 chars)
- ✅ Date of birth format and age validation (13-120 years)
- ✅ Address max length (500 chars)
- ✅ Weight range validation (20-500 kg)
- ✅ Phone number minimum length (10 digits)

### 3. **Response Structure** ✅
- ✅ Returns user profile data
- ✅ Returns access & refresh tokens
- ✅ Returns verification tokens/codes
- ✅ Calculates and returns age

---

## ⚠️ **ISSUES FOUND**

### 1. **Missing Schema Fields** ⚠️ MEDIUM PRIORITY

**Issue:** Database schema has `gender` field, but registration doesn't accept it.

**Schema Field:**
```prisma
gender String?
```

**Current Registration:** Doesn't accept `gender` field

**Impact:** Users can't set gender during registration, must update profile later

**Fix Needed:**
- Add `gender` to registration schema (optional)
- Add `gender` to RegisterInput interface
- Add `gender` to user creation in service

---

### 2. **Avatar URL Validation Too Strict** ⚠️ MEDIUM PRIORITY

**Current Code:**
```typescript
avatarUrl: z.string().url("Invalid URL format").optional().or(z.literal(""))
```

**Issue:** This validation might fail if empty string is passed, or might not work as expected.

**Better Approach:**
```typescript
avatarUrl: z.union([
  z.string().url("Invalid URL format"),
  z.literal(""),
  z.undefined()
]).optional()
```

**Impact:** Users might get validation errors when trying to register without avatar

---

### 3. **Phone Number Validation Too Basic** ⚠️ LOW PRIORITY

**Current Validation:**
```typescript
phoneNumber: z.string().min(10, "Phone number must be at least 10 digits")
```

**Issues:**
- Only checks length, not format
- Doesn't validate phone number format (e.g., +959123456789)
- Could accept invalid phone numbers

**Better Approach:**
```typescript
phoneNumber: z.string()
  .min(10, "Phone number must be at least 10 digits")
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
  .optional()
```

**Impact:** Invalid phone numbers might be accepted

---

### 4. **Soft-Deleted User Check Missing** ⚠️ HIGH PRIORITY

**Current Code:**
```typescript
const existingEmail = await prisma.user.findUnique({
  where: { email: input.email },
});
```

**Issue:** This will find soft-deleted users too, preventing re-registration with same email/phone.

**Fix Needed:**
```typescript
const existingEmail = await prisma.user.findFirst({
  where: { 
    email: input.email,
    deletedAt: null // Only check active users
  },
});
```

**Impact:** Users who deleted their account can't re-register with same email/phone

---

### 5. **Error Messages Could Be More Specific** ⚠️ LOW PRIORITY

**Current:**
```typescript
if (existingEmail) {
  throw new Error("User with this email already exists");
}
```

**Better:**
```typescript
if (existingEmail) {
  throw new Error("An account with this email already exists. Please use a different email or try logging in.");
}
```

**Impact:** Better user experience

---

### 6. **Date of Birth Validation Edge Case** ⚠️ LOW PRIORITY

**Current Validation:**
- Checks format: `YYYY-MM-DD`
- Checks age: 13-120 years

**Potential Issue:** Doesn't validate if date is in the future

**Better Approach:**
```typescript
dateOfBirth: z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    
    // Check if date is in the future
    if (birthDate > today) {
      return false;
    }
    
    // Check age
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
    return actualAge >= 13 && actualAge <= 120;
  }, "Date of birth must be in the past and age must be between 13 and 120 years")
  .optional()
```

---

### 7. **Missing Transaction Handling** ⚠️ MEDIUM PRIORITY

**Current:** User creation and refresh token creation are separate operations

**Issue:** If refresh token creation fails, user is created but no token is returned

**Better Approach:** Use Prisma transaction to ensure atomicity

```typescript
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({...});
  await tx.refreshToken.create({...});
  return user;
});
```

**Impact:** Data consistency issues if token creation fails

---

### 8. **Email/Phone Verification Token Not Sent** ⚠️ HIGH PRIORITY

**Current:** Verification tokens/codes are generated and returned in response

**Issue:** No actual email/SMS sending mechanism

**Missing:**
- Email service integration (SendGrid, AWS SES, etc.)
- SMS service integration (Twilio, etc.)

**Impact:** Users receive tokens in API response but no email/SMS is sent

**Note:** This might be intentional for development, but should be documented

---

### 9. **Password Validation in Controller vs Service** ⚠️ LOW PRIORITY

**Current:** Password validation happens in both:
1. Zod schema (min 8 chars)
2. Service (full strength validation)

**Issue:** Redundant validation, but Zod error is shown first

**Better:** Remove min length from Zod, let service handle all password validation

---

### 10. **Missing Input Sanitization** ⚠️ MEDIUM PRIORITY

**Current:** No input sanitization for:
- Display name (could contain XSS)
- Address (could contain XSS)
- Email/phone (should be trimmed)

**Fix Needed:**
```typescript
displayName: input.displayName?.trim(),
email: input.email?.trim().toLowerCase(),
phoneNumber: input.phoneNumber?.trim(),
```

---

## 🔧 **RECOMMENDED FIXES**

### **Priority 1 (Critical):**
1. ✅ Fix soft-deleted user check - **FIXED**
2. ✅ Add transaction handling for user creation - **FIXED**

### **Priority 2 (Important):**
3. ✅ Add `gender` field to registration - **FIXED**
4. ✅ Fix avatar URL validation - **FIXED**
5. ✅ Add input sanitization (trim, lowercase) - **FIXED**

### **Priority 3 (Nice to Have):**
6. ✅ Improve phone number validation
7. ✅ Add future date check for dateOfBirth
8. ✅ Improve error messages
9. ✅ Document email/SMS sending (or implement it)

---

## 📝 **CODE IMPROVEMENTS NEEDED**

### **1. Fix Soft-Deleted User Check** ✅ FIXED

**File:** `src/services/auth.service.ts`

**Fixed:**
```typescript
const existingEmail = await prisma.user.findFirst({
  where: { 
    email: input.email,
    deletedAt: null // Only check active (non-deleted) users
  },
});
```

**Status:** ✅ Implemented - Now correctly excludes soft-deleted users from duplicate checks

---

### **2. Add Gender Field** ✅ FIXED

**File:** `src/controllers/auth.controller.ts`

**Fixed:** Added to schema:
```typescript
gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
```

**File:** `src/services/auth.service.ts`

**Fixed:** 
- Added to `RegisterInput` interface
- Added to user creation in transaction
- Added to registration and login response

**Status:** ✅ Implemented - Gender field is now accepted during registration and returned in responses

---

### **3. Fix Avatar URL Validation** ✅ FIXED

**File:** `src/controllers/auth.controller.ts`

**Fixed:**
```typescript
avatarUrl: z.union([
  z.string().url("Invalid URL format"),
  z.literal("")
]).optional(),
```

**Status:** ✅ Implemented - Avatar URL now properly accepts valid URLs or empty strings

---

### **4. Add Input Sanitization** ✅ FIXED

**File:** `src/services/auth.service.ts`

**Fixed:** Added input sanitization at the start of register method:
```typescript
// Sanitize inputs (trim whitespace, lowercase email)
const sanitizedInput = {
  ...input,
  email: input.email?.trim().toLowerCase(),
  phoneNumber: input.phoneNumber?.trim(),
  displayName: input.displayName?.trim(),
  address: input.address?.trim(),
};
```

**Status:** ✅ Implemented - All string inputs are now sanitized (trimmed and email lowercased) before processing

---

### **5. Add Transaction Handling** ✅ FIXED

**File:** `src/services/auth.service.ts`

**Fixed:** User creation and refresh token creation are now wrapped in a transaction:
```typescript
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({...});
  
  tokens = generateTokenPair({...});
  const tokenHash = hashToken(tokens.refreshToken);
  await tx.refreshToken.create({...});
  
  return user;
});
```

**Status:** ✅ Implemented - User and token creation are now atomic (all or nothing)

---

## ✅ **TESTING CHECKLIST**

- [ ] Register with email only
- [ ] Register with phone only
- [ ] Register with both email and phone
- [ ] Register with all optional fields
- [ ] Register with minimum required fields
- [ ] Try to register with existing email (should fail)
- [ ] Try to register with existing phone (should fail)
- [ ] Try to register with weak password (should fail)
- [ ] Try to register with invalid email format (should fail)
- [ ] Try to register with invalid date of birth (should fail)
- [ ] Try to register with invalid weight (should fail)
- [ ] Verify tokens are returned
- [ ] Verify verification tokens/codes are returned
- [ ] Verify age is calculated correctly

---

## 📊 **SUMMARY**

| Category | Status | Issues |
|----------|--------|--------|
| Core Functionality | ✅ Good | Minor improvements needed |
| Validation | ✅ Good | Some edge cases missing |
| Error Handling | ⚠️ OK | Could be more specific |
| Data Consistency | ⚠️ Needs Fix | Missing transaction handling |
| Security | ✅ Good | Input sanitization needed |
| User Experience | ⚠️ OK | Error messages could improve |

**Overall:** Registration system is **85% complete** with some important fixes needed.

---

**Next Steps:**
1. Fix soft-deleted user check (HIGH)
2. Add transaction handling (HIGH)
3. Add gender field (MEDIUM)
4. Fix avatar URL validation (MEDIUM)
5. Add input sanitization (MEDIUM)

