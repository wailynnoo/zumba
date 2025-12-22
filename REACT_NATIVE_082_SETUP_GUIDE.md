# React Native 0.82 Setup Guide - Z-Fit Dance Plus

**Project:** Z-Fit Dance Plus Mobile App  
**Domain:** https://www.z-fitdanceplus.com  
**React Native Version:** 0.82.0  
**Date:** Current

---

## ✅ **Your Setup**

- ✅ Xcode 16.2
- ✅ Android Studio Meerkat (2024.3.2)
- ✅ React Native 0.82.0 (Bare)

---

## 🚀 **Step 1: Create React Native 0.82 Project**

```bash
# Navigate to your project directory
cd /Users/mac/Documents/Zumba/zumba

# Create React Native 0.82 project
npx react-native@0.82.0 init ZFitDanceMobile

# Or if that doesn't work, try:
npx react-native init ZFitDanceMobile --version 0.82.0
```

**Expected Output:**
```
✓ Downloading template
✓ Copying template
✓ Processing template
...
✓ Project initialized successfully!
```

---

## 📦 **Step 2: Install Core Dependencies**

```bash
cd ZFitDanceMobile

# Install TypeScript (if not included)
npm install --save-dev typescript @types/react @types/react-native

# Navigation
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npx react-native install react-native-screens react-native-safe-area-context

# State Management
npm install zustand

# API & Data Fetching
npm install axios @tanstack/react-query

# Video Player
npm install react-native-video

# Multi-language
npm install i18next react-i18next

# Secure Storage
npm install @react-native-async-storage/async-storage
npx react-native install @react-native-async-storage/async-storage

# Other utilities
npm install react-native-gesture-handler
npx react-native install react-native-gesture-handler
```

---

## 🔧 **Step 3: iOS Setup**

```bash
cd ios

# Install CocoaPods dependencies
pod install

# If pod install fails, try:
pod repo update
pod install

cd ..
```

**In Xcode:**
1. Open `ZFitDanceMobile/ios/ZFitDanceMobile.xcworkspace` (NOT .xcodeproj)
2. Select project → Target → Signing & Capabilities
3. Set **Team** (your Apple Developer account)
4. Set **Bundle Identifier**: `com.zfitdance.app`
5. Set **iOS Deployment Target**: 15.0 (recommended)

---

## 🤖 **Step 4: Android Setup**

**In Android Studio:**
1. Open `ZFitDanceMobile/android` folder
2. Wait for Gradle sync
3. Go to **File → Project Structure**
4. Set:
   - **Compile SDK Version**: 34
   - **Target SDK Version**: 34
   - **Min SDK Version**: 23 (Android 6.0)

**Update `android/build.gradle`:**
```gradle
buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 23
        compileSdkVersion = 34
        targetSdkVersion = 34
        ndkVersion = "25.1.8937393"
        kotlinVersion = "1.9.24"
    }
}
```

**Update `android/gradle.properties`:**
```properties
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
```

---

## 🌐 **Step 5: Configure API Integration**

### **Create API Configuration**

**File:** `src/config/api.ts`
```typescript
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3001'  // Development - your local member-api
  : 'https://api.z-fitdanceplus.com';  // Production

export const API_ENDPOINTS = {
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    verifyEmail: '/api/auth/verify/email',
    verifyPhone: '/api/auth/verify/phone',
  },
  videos: {
    list: '/api/videos',
    detail: (id: string) => `/api/videos/${id}`,
    watchUrl: (id: string) => `/api/videos/${id}/watch-url`,
  },
  categories: {
    list: '/api/categories',
    detail: (id: string) => `/api/categories/${id}`,
  },
};
```

### **Create API Client**

**File:** `src/api/client.ts`
```typescript
import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add language header
    const language = await AsyncStorage.getItem('language') || 'en';
    config.params = { ...config.params, lang: language };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or logout
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 📁 **Step 6: Project Structure**

```
ZFitDanceMobile/
├── src/
│   ├── api/
│   │   ├── client.ts
│   │   └── endpoints.ts
│   ├── components/
│   │   ├── common/
│   │   └── video/
│   ├── screens/
│   │   ├── auth/
│   │   ├── home/
│   │   ├── videos/
│   │   └── profile/
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── store/
│   │   ├── authStore.ts
│   │   └── videoStore.ts
│   ├── hooks/
│   ├── utils/
│   ├── i18n/
│   │   ├── locales/
│   │   │   ├── en.json
│   │   │   └── my.json
│   │   └── index.ts
│   ├── config/
│   │   └── api.ts
│   └── types/
├── App.tsx
├── package.json
└── tsconfig.json
```

---

## 🧪 **Step 7: Test the Setup**

### **Run iOS:**
```bash
# Start Metro bundler
npx react-native start

# In another terminal, run iOS
npx react-native run-ios

# Or specific simulator
npx react-native run-ios --simulator="iPhone 15 Pro"
```

### **Run Android:**
```bash
# Start Metro bundler
npx react-native start

# In another terminal, run Android
npx react-native run-android

# Or specific device
npx react-native run-android --deviceId=emulator-5554
```

---

## ✅ **Step 8: Verify Installation**

Check these files exist and are correct:

1. **package.json** - Should have `"react-native": "0.82.0"`
2. **ios/Podfile** - Should be configured correctly
3. **android/build.gradle** - Should have correct SDK versions
4. **App.tsx** - Should render without errors

---

## 🔗 **Step 9: Connect to Your Backend**

### **Update CORS in Member API**

**File:** `fitness-dance-backend/member-api/src/app.ts`

Make sure CORS allows your mobile app:
```typescript
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000", "http://localhost:3001"];

// Add mobile app origins
// For development: Allow all origins or specific localhost
// For production: Add your app's bundle identifier
```

---

## 📝 **Step 10: Environment Configuration**

### **Create `.env` file (optional):**

**File:** `.env`
```
API_BASE_URL=http://localhost:3001
API_PRODUCTION_URL=https://api.z-fitdanceplus.com
```

**Install react-native-config:**
```bash
npm install react-native-config
npx react-native install react-native-config
```

---

## 🎯 **Next Steps**

1. ✅ **Project created** - React Native 0.82
2. ✅ **Dependencies installed** - Core libraries
3. ✅ **API configured** - Connected to member-api
4. ⏭️ **Build authentication** - Login/Register screens
5. ⏭️ **Build video player** - Video playback
6. ⏭️ **Add multi-language** - i18n setup

---

## 🐛 **Troubleshooting**

### **iOS Build Issues:**
```bash
cd ios
rm -rf build Pods Podfile.lock
pod install
cd ..
npx react-native start --reset-cache
```

### **Android Build Issues:**
```bash
cd android
./gradlew clean
cd ..
npx react-native start --reset-cache
```

### **Metro Bundler Issues:**
```bash
npx react-native start --reset-cache
```

---

## 📚 **Useful Commands**

```bash
# Start Metro bundler
npx react-native start

# Run iOS
npx react-native run-ios

# Run Android
npx react-native run-android

# Clear cache
npx react-native start --reset-cache

# Check React Native version
npx react-native --version
```

---

**Your React Native 0.82 project is ready!** 🎉

