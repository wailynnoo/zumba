# App Store Requirements Guide

## Minimal Requirements for Google Play Store & Apple App Store

**Last Updated:** [Date]

---

## ✅ Individual vs Company Registration

### **Can I upload apps as an individual (not a company)?**

**YES!** Both Google Play Store and Apple App Store allow individual developers to register and publish apps.

### Google Play Store

- ✅ **Individuals:** Can register with personal name
- ✅ **Companies:** Can register with business name
- **No difference in features or capabilities**
- **Same $25 one-time fee for both**

### Apple App Store

- ✅ **Individuals:** Can register with personal name
  - NO D-U-N-S number required
  - Faster registration process (1-2 days)
- ✅ **Organizations:** Can register with business name
  - D-U-N-S number required (can take 1-2 weeks to obtain)
  - More complex registration process
- **Same $99/year fee for both**
- **Same features and capabilities**

### Key Differences (Individual vs Company)

| Feature                   | Individual        | Company/Organization      |
| ------------------------- | ----------------- | ------------------------- |
| **Registration Time**     | Faster (1-2 days) | Slower (may need D-U-N-S) |
| **D-U-N-S Required**      | ❌ No             | ✅ Yes (Apple only)       |
| **Business Registration** | ❌ Not required   | ✅ May be required        |
| **App Publishing**        | ✅ Same           | ✅ Same                   |
| **Revenue**               | Personal income   | Business income           |
| **Tax Implications**      | Personal tax      | Business tax              |
| **Team Members**          | Limited           | Can add team members      |

### Recommendation

- **Start as Individual:** If you're just starting out, register as an individual
- **Upgrade Later:** You can always upgrade to organization account later if needed
- **No Limitations:** Individual accounts have the same app publishing capabilities

---

## 📱 Google Play Store Requirements

### 1. Developer Account Setup

- [ ] **Google Play Developer Account** - $25 one-time registration fee
- [ ] **Account Type:** Individual or Company (both allowed)
  - ✅ **Individual:** Can register with personal name
  - ✅ **Company:** Can register with business name
- [ ] Valid email address
- [ ] Valid payment method (credit/debit card)
- [ ] Developer name and contact information
- [ ] **Note:** No business registration required for individuals

### 2. App Technical Requirements

#### 2.1 App Bundle/APK

- [ ] **Android App Bundle (AAB)** format (recommended) or APK
- [ ] Minimum SDK version: Android 5.0 (API level 21) or higher
- [ ] Target SDK version: Latest Android version
- [ ] App must be signed with a release keystore
- [ ] App size: Maximum 150MB for APK (larger files need expansion files)

#### 2.2 App Information

- [ ] **App name** (max 50 characters)
- [ ] **Short description** (max 80 characters)
- [ ] **Full description** (max 4000 characters)
- [ ] **App icon** (512x512 pixels, PNG, 32-bit)
- [ ] **Feature graphic** (1024x500 pixels, JPG or PNG)
- [ ] **Screenshots** (minimum 2, maximum 8)
  - Phone: 16:9 or 9:16 aspect ratio, min 320px, max 3840px
  - Tablet: 7-inch and 10-inch screenshots (optional but recommended)
- [ ] **App category** selection
- [ ] **Content rating** questionnaire completion
- [ ] **Privacy policy URL** (required for apps that collect user data)

#### 2.3 Content Rating

- [ ] Complete IARC (International Age Rating Coalition) questionnaire
- [ ] Rating will be assigned automatically based on questionnaire

### 3. Legal & Compliance

#### 3.1 Privacy Policy

- [ ] **Privacy Policy URL** (mandatory if app collects any user data)
- [ ] Must be accessible via web link
- [ ] Must explain what data is collected and how it's used
- [ ] Required for apps with:
  - User accounts
  - Analytics
  - Ads
  - In-app purchases
  - Location data
  - Personal information

#### 3.2 Permissions

- [ ] Declare all permissions used in app
- [ ] Justify why each permission is needed
- [ ] Handle runtime permissions properly (Android 6.0+)

#### 3.3 Content Guidelines

- [ ] No prohibited content (violence, hate speech, illegal activities)
- [ ] No copyright infringement
- [ ] No misleading or deceptive content
- [ ] No spam or repetitive content

### 4. Testing Requirements

- [ ] App must be tested and functional
- [ ] No critical bugs or crashes
- [ ] Works on multiple Android versions
- [ ] Works on different screen sizes

### 5. Payment & Monetization

- [ ] If using in-app purchases, must use Google Play Billing
- [ ] If selling physical goods, cannot use Google Play Billing
- [ ] Subscription apps must comply with subscription policies

### 6. Target Audience

- [ ] Select target age group
- [ ] Select target countries/regions
- [ ] Set pricing (free or paid)

---

## 🍎 Apple App Store Requirements

### 1. Developer Account Setup

- [ ] **Apple Developer Program membership** - $99/year
- [ ] **Account Type:** Individual or Organization (both allowed)
  - ✅ **Individual:** Can register with personal name (NO D-U-N-S needed)
  - ✅ **Organization:** Can register with business name (D-U-N-S required)
- [ ] Valid Apple ID
- [ ] Valid payment method
- [ ] Legal entity information (individual or organization)
- [ ] D-U-N-S number (ONLY required for organizations/companies)

### 2. App Technical Requirements

#### 2.1 App Build

- [ ] **iOS App** built with Xcode
- [ ] Minimum iOS version: iOS 12.0 or later (recommended: iOS 13.0+)
- [ ] App must be built for 64-bit architecture
- [ ] App must be code-signed with distribution certificate
- [ ] App must pass App Store validation
- [ ] App size: Maximum 4GB (over 200MB requires Wi-Fi download)

#### 2.2 App Information

- [ ] **App name** (max 30 characters)
- [ ] **Subtitle** (max 30 characters, iOS 11+)
- [ ] **Description** (max 4000 characters)
- [ ] **Keywords** (max 100 characters, comma-separated)
- [ ] **App icon** (1024x1024 pixels, PNG, no transparency, no rounded corners)
- [ ] **Screenshots** (required for each device type)
  - iPhone: 6.5", 5.5", and 4.7" displays
  - iPad: 12.9" and 11" displays (if iPad app)
  - Apple Watch (if applicable)
- [ ] **App preview video** (optional but recommended, max 30 seconds)
- [ ] **App category** (primary and secondary)
- [ ] **Age rating** (must complete questionnaire)

#### 2.3 App Store Listing

- [ ] **Support URL** (required)
- [ ] **Marketing URL** (optional)
- [ ] **Privacy policy URL** (required for apps that collect user data)
- [ ] **App Store Connect** account setup

### 3. Legal & Compliance

#### 3.1 Privacy Policy

- [ ] **Privacy Policy URL** (mandatory if app collects any user data)
- [ ] Must be accessible via web link
- [ ] Must comply with App Store Review Guidelines
- [ ] Required for apps with:
  - User accounts
  - Analytics
  - Ads
  - In-app purchases
  - Location data
  - Health data
  - Personal information
  - Third-party data sharing

#### 3.2 App Privacy Details

- [ ] Complete App Privacy section in App Store Connect
- [ ] Declare all data types collected
- [ ] Declare how data is used
- [ ] Declare if data is linked to user identity
- [ ] Declare if data is used for tracking

#### 3.3 Content Guidelines

- [ ] Must comply with App Store Review Guidelines
- [ ] No prohibited content
- [ ] No copyright infringement
- [ ] No misleading functionality
- [ ] No spam or repetitive content
- [ ] No broken functionality

### 4. Testing Requirements

- [ ] App must pass App Store review
- [ ] No critical bugs or crashes
- [ ] Works on latest iOS version
- [ ] Works on multiple device sizes
- [ ] TestFlight beta testing (optional but recommended)

### 5. Payment & Monetization

- [ ] If using in-app purchases, must use StoreKit
- [ ] Physical goods cannot use in-app purchases
- [ ] Subscription apps must comply with subscription guidelines
- [ ] External payment links are restricted

### 6. Target Audience

- [ ] Select age rating
- [ ] Select availability by country
- [ ] Set pricing (free or paid)
- [ ] Set availability date

---

## 🔄 Common Requirements (Both Stores)

### 1. Essential Assets

- [ ] **App Icon** (different sizes for each platform)
- [ ] **Screenshots** (platform-specific sizes)
- [ ] **App Description** (optimized for each store)
- [ ] **Privacy Policy** (web-accessible URL)

### 2. Legal Documents

- [ ] **Privacy Policy** (mandatory if collecting data)
- [ ] **Terms of Service** (recommended)
- [ ] **End User License Agreement (EULA)** (optional, defaults provided)

### 3. Technical Requirements

- [ ] App must be functional and stable
- [ ] No critical bugs
- [ ] Proper error handling
- [ ] Network connectivity handling
- [ ] Proper app permissions usage

### 4. Content Requirements

- [ ] Original content or properly licensed
- [ ] No copyright infringement
- [ ] Appropriate content rating
- [ ] No prohibited content

### 5. User Experience

- [ ] Intuitive navigation
- [ ] Clear user interface
- [ ] Proper loading states
- [ ] Error messages
- [ ] Accessibility considerations

---

## 📋 Minimum Viable Product (MVP) Checklist for App Stores

### For Your Fitness Dance App:

#### Technical MVP

- [ ] App installs and launches without crashes
- [ ] Basic video playback works
- [ ] User can browse categories
- [ ] User can view videos
- [ ] Basic user authentication (if required)
- [ ] Basic e-commerce functionality (if including wearables)

#### Content MVP

- [ ] At least 5-10 videos per category (minimum)
- [ ] App icon and screenshots ready
- [ ] App description written
- [ ] Privacy policy published online

#### Legal MVP

- [ ] Privacy policy URL ready
- [ ] Terms of service (if applicable)
- [ ] Content licensing verified
- [ ] Music licensing verified (if using copyrighted music)

#### Store Listing MVP

- [ ] App name finalized
- [ ] Description optimized
- [ ] Screenshots prepared (minimum required)
- [ ] Category selected
- [ ] Age rating completed

---

## ⚠️ Common Rejection Reasons

### Google Play Store

1. **Privacy Policy Missing** - Most common rejection
2. **App crashes** - Technical issues
3. **Misleading content** - False claims
4. **Copyright issues** - Unauthorized content
5. **Inappropriate content** - Violates content policies
6. **Spam** - Repetitive or low-quality content

### Apple App Store

1. **Privacy Policy Missing** - Most common rejection
2. **App crashes** - Technical issues
3. **Guideline violations** - Doesn't comply with review guidelines
4. **Incomplete information** - Missing required app information
5. **Broken functionality** - Features don't work as described
6. **Copyright issues** - Unauthorized content

---

## 💰 Cost Summary

### Google Play Store

- **Developer Account:** $25 (one-time)
- **App Submission:** Free
- **Annual Renewal:** Not required

### Apple App Store

- **Developer Program:** $99/year
- **App Submission:** Free
- **Annual Renewal:** $99/year

### Additional Costs (Optional)

- App Store Optimization (ASO) tools
- Analytics tools
- Crash reporting tools
- Marketing and advertising

---

## 📅 Typical Timeline

### Google Play Store

- **Account Setup:** 1-2 days
- **App Review:** 1-3 days (usually faster)
- **Total:** 2-5 days from submission to live

### Apple App Store

- **Account Setup:** 1-3 days (longer if D-U-N-S needed)
- **App Review:** 1-7 days (can be longer)
- **Total:** 2-10 days from submission to live

---

## 🎯 Quick Start Checklist

### Before You Start Development:

1. [ ] Register developer accounts (both platforms)
2. [ ] Set up development environment
3. [ ] Create privacy policy template
4. [ ] Plan app icon and screenshots
5. [ ] Research content licensing requirements

### During Development:

1. [ ] Test on multiple devices
2. [ ] Handle errors gracefully
3. [ ] Implement proper permissions
4. [ ] Optimize app size
5. [ ] Test offline scenarios

### Before Submission:

1. [ ] Complete all required app information
2. [ ] Prepare all screenshots
3. [ ] Write app description
4. [ ] Publish privacy policy online
5. [ ] Test app thoroughly
6. [ ] Complete content rating questionnaires

---

## 📚 Resources

### Google Play Store

- [Google Play Console](https://play.google.com/console)
- [Play Console Help](https://support.google.com/googleplay/android-developer)
- [Content Policy](https://play.google.com/about/developer-content-policy/)

### Apple App Store

- [App Store Connect](https://appstoreconnect.apple.com)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

---

## 🔍 For Your Fitness Dance App Specifically

### Critical Requirements:

1. **Privacy Policy** - Required (user accounts, analytics, e-commerce)
2. **Content Licensing** - Verify all video content is properly licensed
3. **Music Licensing** - If using copyrighted music in videos
4. **E-commerce Compliance** - Payment processing, shipping, returns policy
5. **Video Hosting** - Ensure videos comply with platform policies
6. **Age Rating** - Likely "4+" or "12+" depending on content

### Recommended Before Launch:

- [ ] Beta testing (TestFlight for iOS, Internal Testing for Android)
- [ ] App Store Optimization (ASO)
- [ ] Marketing materials ready
- [ ] Support email/contact ready
- [ ] Terms of service published

---

**Note:** Requirements may change. Always check the official documentation before submission.
