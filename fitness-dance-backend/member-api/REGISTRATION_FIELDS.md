# Member Registration Fields ✅

**Updated registration to include all profile information**

---

## 📋 Registration Fields

### **Required Fields:**

1. **Email OR Phone Number** (at least one required)
   - `email`: Valid email format (optional if phone provided)
   - `phoneNumber`: Minimum 10 digits (optional if email provided)

2. **Password**
   - Minimum 8 characters
   - Must meet strength requirements (uppercase, lowercase, number, special char)

3. **Name (displayName)**
   - Required
   - Minimum 1 character
   - Maximum 100 characters

---

### **Optional Profile Fields:**

4. **Profile Picture (avatarUrl)**
   - Valid URL format
   - Can be empty string

5. **Date of Birth (dateOfBirth)**
   - Format: `YYYY-MM-DD` (e.g., "1990-01-15")
   - Age must be between 13 and 120 years
   - Age is automatically calculated and returned in response

6. **Address**
   - Maximum 500 characters
   - Optional

7. **Weight**
   - Number (in kg)
   - Minimum: 20 kg
   - Maximum: 500 kg
   - Optional

---

## 📝 Registration Request Example

```json
{
  "email": "user@example.com",
  "phoneNumber": "+959123456789",
  "password": "SecurePass123!",
  "displayName": "John Doe",
  "avatarUrl": "https://example.com/avatar.jpg",
  "dateOfBirth": "1990-01-15",
  "address": "123 Main St, Yangon, Myanmar",
  "weight": 70.5
}
```

**Minimum Required:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "displayName": "John Doe"
}
```

---

## ✅ Registration Response

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "phoneNumber": "+959123456789",
      "displayName": "John Doe",
      "avatarUrl": "https://example.com/avatar.jpg",
      "dateOfBirth": "1990-01-15T00:00:00.000Z",
      "age": 34,
      "address": "123 Main St, Yangon, Myanmar",
      "weight": 70.5,
      "isEmailVerified": false,
      "isPhoneVerified": false
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    },
    "verification": {
      "emailToken": "...",
      "phoneCode": "123456"
    }
  }
}
```

---

## 🔍 Validation Rules

### **Email:**
- Valid email format
- Optional (if phoneNumber provided)

### **Phone Number:**
- Minimum 10 digits
- Optional (if email provided)
- At least one of email or phoneNumber must be provided

### **Password:**
- Minimum 8 characters
- Must contain:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

### **Name (displayName):**
- Required
- Minimum 1 character
- Maximum 100 characters

### **Profile Picture (avatarUrl):**
- Valid URL format
- Optional
- Can be empty string

### **Date of Birth:**
- Format: `YYYY-MM-DD`
- Age must be between 13 and 120 years
- Optional
- Age is automatically calculated

### **Address:**
- Maximum 500 characters
- Optional

### **Weight:**
- Number (in kg)
- Minimum: 20 kg
- Maximum: 500 kg
- Optional

---

## 🎯 Field Summary

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | Yes* | Valid email format |
| phoneNumber | string | Yes* | Min 10 digits |
| password | string | Yes | Min 8 chars, strength requirements |
| displayName | string | Yes | Min 1, max 100 chars |
| avatarUrl | string | No | Valid URL or empty |
| dateOfBirth | string | No | YYYY-MM-DD, age 13-120 |
| address | string | No | Max 500 chars |
| weight | number | No | 20-500 kg |

*At least one of email or phoneNumber is required

---

## ✅ What's Updated

1. ✅ **Name (displayName)** - Now required with validation
2. ✅ **Profile Picture (avatarUrl)** - URL validation
3. ✅ **Date of Birth** - Age validation (13-120 years)
4. ✅ **Age** - Automatically calculated from dateOfBirth
5. ✅ **Address** - Max length validation
6. ✅ **Weight** - Range validation (20-500 kg)
7. ✅ **Phone** - Minimum length validation
8. ✅ **Email** - Email format validation

---

## 🚀 Ready for Testing

All fields are now properly validated and included in the registration response!

**Test with Postman:**
```bash
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test1234!",
  "displayName": "Test User",
  "dateOfBirth": "1990-01-15",
  "address": "Test Address",
  "weight": 70
}
```

---

**Registration fields updated and ready!** ✅

