# Multi-Language Support Implementation Plan

**Status:** Planning  
**Priority:** Medium

---

## 📋 **Overview**

The member API needs to support multiple languages for:
- API error messages
- Validation messages
- Success messages
- Response content (where applicable)

**Current State:**
- ✅ User schema has `preferredLang` field (default: "en")
- ❌ No language detection/translation system
- ❌ All messages are hardcoded in English

---

## 🎯 **Supported Languages**

Based on requirements, suggested languages:
- **en** - English (default)
- **my** - Myanmar (Burmese) - likely needed for Myanmar market
- **th** - Thai (if targeting Thailand)
- **zh** - Chinese (if targeting China/Taiwan)
- **es** - Spanish (for broader reach)

**Initial Implementation:** Start with **en** and **my** (Myanmar), add more as needed.

---

## 🏗️ **Architecture**

### **Approach: JSON Translation Files + Middleware**

1. **Translation Files:** Store translations in JSON files per language
2. **Language Detection:** 
   - Check user's `preferredLang` (if authenticated)
   - Fallback to `Accept-Language` header
   - Fallback to query parameter `?lang=en`
   - Default to "en"
3. **Middleware:** Detect and set language on request
4. **Translation Service:** Centralized service to get translated messages

---

## 📁 **File Structure**

```
member-api/
├── src/
│   ├── i18n/
│   │   ├── index.ts              # Translation service
│   │   ├── middleware.ts         # Language detection middleware
│   │   └── locales/
│   │       ├── en.json            # English translations
│   │       ├── my.json            # Myanmar translations
│   │       └── types.ts           # TypeScript types
│   ├── middleware/
│   │   └── language.middleware.ts # Language middleware (wrapper)
│   └── ...
```

---

## 🔧 **Implementation Steps**

### **Step 1: Create Translation Files**

**File:** `src/i18n/locales/en.json`
```json
{
  "auth": {
    "register": {
      "success": "User registered successfully",
      "emailExists": "User with this email already exists",
      "phoneExists": "User with this phone number already exists",
      "emailOrPhoneRequired": "Either email or phone number is required",
      "passwordWeak": "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character"
    },
    "login": {
      "success": "Login successful",
      "invalidCredentials": "Invalid credentials",
      "accountDeactivated": "Account is deactivated"
    },
    "verify": {
      "emailSuccess": "Email verified successfully",
      "phoneSuccess": "Phone number verified successfully",
      "invalidToken": "Invalid or expired verification token",
      "codeExpired": "Verification code expired"
    }
  },
  "validation": {
    "emailInvalid": "Invalid email format",
    "phoneMinLength": "Phone number must be at least 10 digits",
    "passwordMinLength": "Password must be at least 8 characters",
    "displayNameRequired": "Name is required",
    "displayNameMaxLength": "Name must be less than 100 characters",
    "ageRange": "Age must be between 13 and 120 years",
    "weightRange": "Weight must be between 20 and 500 kg",
    "addressMaxLength": "Address must be less than 500 characters"
  },
  "errors": {
    "notFound": "Resource not found",
    "unauthorized": "Authentication required",
    "forbidden": "Access denied",
    "serverError": "Internal server error",
    "validationError": "Validation error"
  }
}
```

**File:** `src/i18n/locales/my.json` (Myanmar)
```json
{
  "auth": {
    "register": {
      "success": "အကောင့်အောင်မြင်စွာဖွင့်လှစ်ပြီးပါပြီ",
      "emailExists": "ဤအီးမေးလ်ဖြင့် အသုံးပြုသူရှိပြီးသားဖြစ်ပါသည်",
      "phoneExists": "ဤဖုန်းနံပါတ်ဖြင့် အသုံးပြုသူရှိပြီးသားဖြစ်ပါသည်",
      "emailOrPhoneRequired": "အီးမေးလ် သို့မဟုတ် ဖုန်းနံပါတ် တစ်ခုခု လိုအပ်ပါသည်",
      "passwordWeak": "စကားဝှက်သည် အနည်းဆုံး ၈ လုံးရှိရမည်ဖြစ်ပြီး အကြီးစား၊ အသေးစား၊ ဂဏန်းနှင့် အထူးစာလုံး ပါဝင်ရမည်"
    },
    "login": {
      "success": "ဝင်ရောက်မှု အောင်မြင်ပါသည်",
      "invalidCredentials": "မှားယွင်းသော အထောက်အထားများ",
      "accountDeactivated": "အကောင့်ကို ပိတ်ထားပါသည်"
    },
    "verify": {
      "emailSuccess": "အီးမေးလ် အတည်ပြုပြီးပါပြီ",
      "phoneSuccess": "ဖုန်းနံပါတ် အတည်ပြုပြီးပါပြီ",
      "invalidToken": "မှားယွင်းသော သို့မဟုတ် သက်တမ်းကုန်သွားသော အတည်ပြုရန် token",
      "codeExpired": "အတည်ပြုရန် code သက်တမ်းကုန်သွားပါပြီ"
    }
  },
  "validation": {
    "emailInvalid": "မှားယွင်းသော အီးမေးလ် format",
    "phoneMinLength": "ဖုန်းနံပါတ်သည် အနည်းဆုံး ၁၀ လုံး ရှိရမည်",
    "passwordMinLength": "စကားဝှက်သည် အနည်းဆုံး ၈ လုံး ရှိရမည်",
    "displayNameRequired": "အမည် လိုအပ်ပါသည်",
    "displayNameMaxLength": "အမည်သည် ၁၀၀ လုံးထက် နည်းရမည်",
    "ageRange": "အသက်သည် ၁၃ နှင့် ၁၂၀ ကြားရှိရမည်",
    "weightRange": "ကိုယ်အလေးချိန်သည် ၂၀ နှင့် ၅၀၀ kg ကြားရှိရမည်",
    "addressMaxLength": "လိပ်စာသည် ၅၀၀ လုံးထက် နည်းရမည်"
  },
  "errors": {
    "notFound": "အရင်းအမြစ် မတွေ့ရှိပါ",
    "unauthorized": "အတည်ပြုခြင်း လိုအပ်ပါသည်",
    "forbidden": "ဝင်ရောက်ခွင့် ငြင်းဆိုထားပါသည်",
    "serverError": "ဆာဗာတွင် အမှားအယွင်း",
    "validationError": "အတည်ပြုခြင်း အမှား"
  }
}
```

---

### **Step 2: Create Translation Service**

**File:** `src/i18n/index.ts`
```typescript
import enTranslations from './locales/en.json';
import myTranslations from './locales/my.json';

type TranslationKey = string;
type SupportedLanguage = 'en' | 'my';

const translations: Record<SupportedLanguage, any> = {
  en: enTranslations,
  my: myTranslations,
};

const defaultLanguage: SupportedLanguage = 'en';

/**
 * Get translation for a key
 * @param key - Translation key (e.g., "auth.register.success")
 * @param lang - Language code (default: "en")
 * @param params - Optional parameters to replace in translation
 */
export function t(
  key: TranslationKey,
  lang: SupportedLanguage = defaultLanguage,
  params?: Record<string, string | number>
): string {
  const translation = translations[lang] || translations[defaultLanguage];
  
  // Navigate nested object using dot notation
  const keys = key.split('.');
  let value: any = translation;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to default language
      value = translations[defaultLanguage];
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey];
        } else {
          return key; // Return key if translation not found
        }
      }
      break;
    }
  }
  
  if (typeof value !== 'string') {
    return key; // Return key if translation is not a string
  }
  
  // Replace parameters if provided
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }
  
  return value;
}

/**
 * Get supported languages
 */
export function getSupportedLanguages(): SupportedLanguage[] {
  return Object.keys(translations) as SupportedLanguage[];
}

/**
 * Check if language is supported
 */
export function isLanguageSupported(lang: string): lang is SupportedLanguage {
  return lang in translations;
}

export { defaultLanguage, SupportedLanguage };
```

---

### **Step 3: Create Language Detection Middleware**

**File:** `src/i18n/middleware.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { isLanguageSupported, defaultLanguage, SupportedLanguage } from './index';
import { AuthRequest } from '../middleware/auth.middleware';

// Extend Request to include language
declare global {
  namespace Express {
    interface Request {
      language?: SupportedLanguage;
    }
  }
}

/**
 * Parse Accept-Language header
 * Returns preferred language code
 */
function parseAcceptLanguage(acceptLanguage: string | undefined): string {
  if (!acceptLanguage) return defaultLanguage;
  
  // Parse: "en-US,en;q=0.9,my;q=0.8"
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, q = 'q=1'] = lang.trim().split(';');
      const quality = parseFloat(q.replace('q=', ''));
      return { code: code.split('-')[0].toLowerCase(), quality };
    })
    .sort((a, b) => b.quality - a.quality);
  
  return languages[0]?.code || defaultLanguage;
}

/**
 * Detect language from request
 * Priority:
 * 1. Query parameter (?lang=en)
 * 2. User's preferredLang (if authenticated)
 * 3. Accept-Language header
 * 4. Default (en)
 */
export function detectLanguage(req: Request | AuthRequest): SupportedLanguage {
  // 1. Check query parameter
  const queryLang = req.query.lang as string;
  if (queryLang && isLanguageSupported(queryLang)) {
    return queryLang;
  }
  
  // 2. Check user's preferred language (if authenticated)
  if ('user' in req && req.user) {
    // User's preferredLang from database
    // Note: This would need to be loaded from user record
    // For now, we'll get it from a custom property if set
    const userLang = (req as any).userPreferredLang;
    if (userLang && isLanguageSupported(userLang)) {
      return userLang;
    }
  }
  
  // 3. Check Accept-Language header
  const headerLang = parseAcceptLanguage(req.headers['accept-language']);
  if (isLanguageSupported(headerLang)) {
    return headerLang;
  }
  
  // 4. Default
  return defaultLanguage;
}

/**
 * Middleware to detect and set language on request
 */
export function languageMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  req.language = detectLanguage(req);
  next();
}
```

---

### **Step 4: Update Auth Middleware to Load User Language**

**File:** `src/middleware/auth.middleware.ts` (update)

Add to `authenticate` function:
```typescript
// After loading user, add preferredLang to request
req.user = {
  userId: user.id,
  // ... other fields
};

// Set user's preferred language on request for i18n
(req as any).userPreferredLang = user.preferredLang;
```

---

### **Step 5: Update Services to Use Translations**

**File:** `src/services/auth.service.ts` (example update)

```typescript
import { t } from '../i18n';
import { SupportedLanguage } from '../i18n';

// In register method:
async register(input: RegisterInput, req?: Request) {
  const lang: SupportedLanguage = (req as any)?.language || 'en';
  
  // Use translations
  if (!sanitizedInput.email && !sanitizedInput.phoneNumber) {
    throw new Error(t('auth.register.emailOrPhoneRequired', lang));
  }
  
  if (existingEmail) {
    throw new Error(t('auth.register.emailExists', lang));
  }
  
  // ... rest of code
}
```

---

### **Step 6: Update Controllers to Use Translations**

**File:** `src/controllers/auth.controller.ts` (example update)

```typescript
import { t } from '../i18n';
import { SupportedLanguage } from '../i18n';

async register(req: Request, res: Response): Promise<void> {
  try {
    const lang: SupportedLanguage = (req as any).language || 'en';
    const validated = registerSchema.parse(req.body);
    const result = await authService.register(validated, req);

    res.status(201).json({
      success: true,
      message: t('auth.register.success', lang),
      data: result,
    });
  } catch (error: any) {
    // ... error handling with translations
  }
}
```

---

### **Step 7: Add Language to App**

**File:** `src/app.ts`

```typescript
import { languageMiddleware } from './i18n/middleware';

// Add after body parsing, before routes
app.use(languageMiddleware);
```

---

## 📝 **Usage Examples**

### **In Controllers:**
```typescript
const lang: SupportedLanguage = req.language || 'en';
res.json({
  success: true,
  message: t('auth.register.success', lang),
});
```

### **In Services:**
```typescript
throw new Error(t('auth.register.emailExists', lang));
```

### **With Parameters:**
```typescript
// Translation: "Hello {{name}}, welcome!"
t('greeting.welcome', lang, { name: 'John' })
// Returns: "Hello John, welcome!"
```

---

## 🔄 **Language Selection Methods**

1. **Query Parameter:** `GET /api/videos?lang=my`
2. **Accept-Language Header:** `Accept-Language: my,en;q=0.9`
3. **User Preference:** Automatically from `user.preferredLang` (if authenticated)
4. **Default:** Falls back to "en"

---

## ✅ **Benefits**

- ✅ Centralized translations
- ✅ Easy to add new languages
- ✅ Automatic language detection
- ✅ Respects user preferences
- ✅ Type-safe (with TypeScript)
- ✅ Fallback to English if translation missing

---

## 🚀 **Next Steps**

1. Create translation files structure
2. Implement translation service
3. Add language middleware
4. Update all error/success messages to use translations
5. Add language selection to registration (update preferredLang)
6. Test with different languages

---

## 📊 **Priority**

- **Phase 1:** English + Myanmar (my)
- **Phase 2:** Add more languages as needed
- **Phase 3:** Content translations (video titles, descriptions, knowledge articles)

---

**Ready to implement!** 🎉

