# React Native App - Version & Setup Discussion

**Project:** Z-Fit Dance Plus Mobile App  
**Domain:** https://www.z-fitdanceplus.com  
**Date:** Current  
**Status:** Planning Phase

---

## 🎯 **Key Requirements**

Based on your project needs:
- ✅ **Both iOS & Android** support
- ✅ **Video playback** (Cloudflare Stream + YouTube)
- ✅ **Offline video downloads** (future)
- ✅ **Push notifications** (Firebase)
- ✅ **Payment integration** (Stripe + App Store)
- ✅ **Multi-language** support (en, my)
- ✅ **Authentication** (JWT with member API)

---

## 🤔 **Decision 1: Expo vs Bare React Native**

### **Option A: Expo (Recommended for MVP)**

**Pros:**
- ✅ **Faster development** - No native code setup needed
- ✅ **Easy deployment** - OTA updates, EAS Build
- ✅ **Built-in features** - Camera, notifications, file system
- ✅ **Better for MVP** - Get to market faster
- ✅ **Expo Router** - File-based routing (like Next.js)
- ✅ **Expo SDK 51** - Latest stable, supports all needed features

**Cons:**
- ⚠️ **Larger app size** (~5-10MB overhead)
- ⚠️ **Some native modules** require custom development builds
- ⚠️ **Less control** over native code (but usually not needed)

**Best For:** MVP, faster development, easier maintenance

---

### **Option B: Bare React Native**

**Pros:**
- ✅ **Full control** - Complete access to native code
- ✅ **Smaller app size** - No Expo overhead
- ✅ **More flexibility** - Any native module
- ✅ **Better performance** - Direct native access

**Cons:**
- ❌ **Complex setup** - Need Xcode, Android Studio
- ❌ **More maintenance** - Native dependencies management
- ❌ **Slower development** - More configuration needed
- ❌ **Harder updates** - Manual native updates

**Best For:** Complex native features, maximum performance needs

---

## 🎯 **Recommendation: Expo (with Development Build)**

**Why:**
1. ✅ **Faster MVP development** - Get to market quickly
2. ✅ **Easier team collaboration** - No native setup needed
3. ✅ **OTA updates** - Fix bugs without app store approval
4. ✅ **All features supported** - Video, notifications, payments work
5. ✅ **Can eject later** - If needed, can go bare later

**Expo Development Build:**
- Use when you need custom native modules
- Still get Expo benefits
- Best of both worlds

---

## 📱 **React Native Version Recommendation**

### **Option 1: React Native 0.83.x (Latest Stable) ✅ RECOMMENDED**

**Version:** React Native 0.83.x (Latest as of Dec 2024)

**Pros:**
- ✅ **Latest stable** - Most recent features and fixes
- ✅ **Active support** - Regular security updates
- ✅ **Better performance** - Latest optimizations
- ✅ **React 19 support** - Compatible with React 19.1.1
- ✅ **Future-proof** - Aligned with React Native roadmap
- ✅ **Security** - Latest security patches

**Cons:**
- ⚠️ **Newer** - May need to check library compatibility

**Best For:** New projects, want latest features and security

---

### **Option 2: React Native 0.82.x (Very Stable)**

**Version:** React Native 0.82.x (Released Oct 2024)

**Pros:**
- ✅ **Very stable** - Well-tested in production
- ✅ **Large community** - More examples, solutions
- ✅ **Proven** - Used by many apps
- ✅ **React 19 support** - Compatible with latest React

**Cons:**
- ⚠️ **Slightly older** - Missing some 0.83 improvements

**Best For:** Conservative approach, maximum stability

---

### **Option 3: React Native 0.74.x (Outdated - NOT RECOMMENDED)**

**Version:** React Native 0.74.x

**Status:** ❌ **No longer supported** (Support ended Jan 2025)

**Cons:**
- ❌ **No security updates** - Security vulnerabilities
- ❌ **No bug fixes** - Issues won't be fixed
- ❌ **Outdated** - Missing many improvements

**Best For:** ❌ Not recommended for new projects

---

## 🎯 **Final Recommendation**

### **Expo SDK (Latest) + React Native 0.83.x**

**Why:**
1. ✅ **Latest React Native** - 0.83.x (most recent stable)
2. ✅ **Latest Expo SDK** - Check compatibility with RN 0.83
3. ✅ **Security** - Active support and updates
4. ✅ **Performance** - Latest optimizations
5. ✅ **Future-proof** - Aligned with roadmap
6. ✅ **All features work** - Video, payments, notifications

**Note:** Check Expo SDK compatibility with RN 0.83. If Expo doesn't support 0.83 yet, use the latest Expo SDK version that supports the highest RN version (likely 0.82.x or 0.81.x).

---

## 📦 **Recommended Tech Stack for Mobile App**

```
Expo SDK (Latest - check compatibility)
├── React Native 0.83.x (or latest stable)
├── TypeScript
├── Expo Router (Navigation)
├── Zustand (State Management)
├── React Query / TanStack Query (API calls)
├── Axios (HTTP client)
├── react-native-video (Video player)
├── @react-native-firebase/app (Firebase)
├── @react-native-firebase/messaging (Push notifications)
├── expo-av (Alternative video player)
├── react-native-i18n (Multi-language)
└── @stripe/stripe-react-native (Payments)
```

**Important:** Check Expo SDK compatibility:
- Latest Expo SDK may support RN 0.82.x or 0.81.x
- If using bare React Native, use 0.83.x directly
- Verify library compatibility with RN 0.83.x

---

## 🏗️ **Project Structure**

```
z-fit-dance-mobile/
├── app/                    # Expo Router (file-based routing)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── index.tsx      # Home
│   │   ├── videos.tsx
│   │   ├── playlists.tsx
│   │   └── profile.tsx
│   └── _layout.tsx
├── src/
│   ├── api/               # API client
│   │   ├── client.ts
│   │   └── endpoints.ts
│   ├── components/        # Reusable components
│   ├── hooks/             # Custom hooks
│   ├── store/             # Zustand stores
│   ├── utils/             # Utilities
│   ├── i18n/              # Translations
│   └── types/             # TypeScript types
├── assets/                # Images, fonts, etc.
├── app.json               # Expo config
└── package.json
```

---

## 🔧 **Initial Setup Steps**

### **1. Install Expo CLI**
```bash
npm install -g expo-cli
# or
npx create-expo-app@latest
```

### **2. Create Project**
```bash
# For Expo (check latest Expo SDK)
npx create-expo-app@latest z-fit-dance-mobile --template
# Choose: "Blank (TypeScript)"

# OR for Bare React Native (latest version)
npx react-native@latest init ZFitDanceMobile --version 0.83.0
```

### **3. Install Core Dependencies**
```bash
cd z-fit-dance-mobile
npm install

# Navigation
npx expo install expo-router react-native-safe-area-context react-native-screens

# State Management
npm install zustand

# API
npm install axios @tanstack/react-query

# Video
npx expo install expo-av

# Multi-language
npm install i18next react-i18next

# Other
npx expo install expo-secure-store expo-constants
```

### **4. Configure Expo**
```json
// app.json
{
  "expo": {
    "name": "Z-Fit Dance Plus",
    "slug": "z-fit-dance-plus",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png"
    },
    "scheme": "zfitdance",
    "userInterfaceStyle": "automatic",
    "ios": {
      "bundleIdentifier": "com.zfitdance.app",
      "supportsTablet": true
    },
    "android": {
      "package": "com.zfitdance.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router"
    ],
    "extra": {
      "apiUrl": "https://api.z-fitdanceplus.com",
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

---

## 🌐 **API Integration**

### **Base URL Configuration**
```typescript
// src/config/api.ts
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3001'  // Development
  : 'https://api.z-fitdanceplus.com';  // Production
```

### **API Client Setup**
```typescript
// src/api/client.ts
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { getStoredToken } from '../utils/storage';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
apiClient.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

---

## 📱 **Development Workflow**

### **Development**
```bash
# Start development server
npx expo start

# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android
```

### **Building**
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

---

## 🎯 **MVP Features Priority**

### **Phase 1: Core (Week 1-2)**
1. ✅ Project setup
2. ✅ Authentication (Login/Register)
3. ✅ API integration
4. ✅ Basic navigation

### **Phase 2: Content (Week 3-4)**
1. ✅ Video listing
2. ✅ Video playback
3. ✅ Category browsing
4. ✅ Search

### **Phase 3: User Features (Week 5-6)**
1. ✅ Profile management
2. ✅ Playlists
3. ✅ Favorites
4. ✅ Multi-language

### **Phase 4: Premium (Week 7-8)**
1. ✅ Subscription management
2. ✅ Payment integration
3. ✅ Premium content access

---

## 💡 **Recommendation Summary**

### **✅ Use: Latest Expo SDK + React Native 0.83.x (or latest stable)**

**Reasons:**
1. ✅ **Latest version** - React Native 0.83.x (most recent stable)
2. ✅ **Security** - Active support and security updates
3. ✅ **Performance** - Latest optimizations and improvements
4. ✅ **All features supported** - Video, payments, notifications
5. ✅ **Future-proof** - Aligned with React Native roadmap
6. ✅ **React 19 support** - Compatible with latest React

**Important Notes:**
- ⚠️ **Check Expo compatibility** - Latest Expo SDK may support RN 0.82.x or 0.81.x
- ✅ **If Expo doesn't support 0.83 yet** - Use latest Expo SDK with highest RN version it supports
- ✅ **If using bare RN** - Use React Native 0.83.x directly
- ✅ **Verify libraries** - Check all dependencies support RN 0.83.x

**Alternative:** If Expo doesn't support 0.83 yet, use bare React Native 0.83.x for maximum control and latest features.

---

## 🚀 **Next Steps**

1. **Decide:** Expo vs Bare React Native
2. **Create project** with chosen approach
3. **Set up API integration** with member API
4. **Configure domain** - Update API URLs
5. **Start with authentication** - First feature to build

---

**Ready to start building!** 🎉

