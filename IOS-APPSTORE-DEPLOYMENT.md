# 🍎 iOS APP STORE DEPLOYMENT GUIDE

## 5-Brand SafeRide Infrastructure → Apple App Store

**Status**: Production-ready iOS builds ready to deploy  
**Firebase Project**: saferide-peld8  
**Brands**: PrevLeak, SafeRide, PaletteMath, Qvedic, Plumber  
**Minimum iOS Version**: 12.4 (or higher)

---

## 📋 PREREQUISITES

### 1. Apple Developer Account
- Cost: **$99 USD/year**
- Go to: https://developer.apple.com/programs/enroll/
- Join as Individual or Organization
- Complete ID verification (phone call)
- **Time**: 1-3 days for approval

### 2. App Store Connect Access
- Go to: https://appstoreconnect.apple.com
- Sign in with Apple Developer account
- Complete two-factor authentication
- **Time**: 5 minutes

### 3. Development Certificates & Provisioning Profiles

Generate via Xcode or manually:

```bash
# Via Xcode (easiest)
# 1. Open flutter_app/ios/Runner.xcworkspace
# 2. Select Runner in Project Navigator
# 3. Go to Signing & Capabilities
# 4. Select Team (your Apple Developer team)
# 5. Xcode auto-generates certificate and profiles
```

Manual process (if needed):
- Go to: https://developer.apple.com/account/resources/certificates
- Create iOS Distribution Certificate (one per team)
- Create App IDs (one per brand)
- Create Provisioning Profiles (one per brand, release)

---

## 🔧 STEP 1: Configure iOS Project

### Update Project Settings

**File**: `flutter_app/ios/Runner.xcodeproj/project.pbxproj`

Or via Xcode:

1. Open `flutter_app/ios/Runner.xcworkspace`
2. Select `Runner` project
3. Go to **Build Settings**
4. Set for each brand:
   - **Product Name**: PrevLeak, SafeRide, etc.
   - **Bundle Identifier**: com.prevleakgroup.prevleak, com.saferideinc.saferide, etc.
   - **Version**: 1.0.0
   - **Build**: 1

### Configure Brand-Specific Info.plist

**File**: `flutter_app/ios/Runner/Info.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>SafeRide</string>
    
    <key>CFBundleIdentifier</key>
    <string>com.saferideinc.saferide</string>
    
    <key>CFBundleVersion</key>
    <string>1</string>
    
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <false/>
        <key>NSExceptionDomains</key>
        <dict>
            <key>saferide-peld8.web.app</key>
            <dict>
                <key>NSIncludesSubdomains</key>
                <true/>
                <key>NSExceptionAllowsInsecureHTTPLoads</key>
                <false/>
            </dict>
        </dict>
    </dict>
    
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>SafeRide needs location access for ride matching and route optimization</string>
    
    <key>NSCameraUsageDescription</key>
    <string>SafeRide needs camera access for driver verification</string>
    
    <key>NSPhotoLibraryUsageDescription</key>
    <string>SafeRide needs photo access for profile pictures</string>
    
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
    </array>
    
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationPortraitUpsideDown</string>
    </array>
    
    <key>UILaunchStoryboardName</key>
    <string>LaunchScreen</string>
</dict>
</plist>
```

**Repeat for each brand** with appropriate:
- Bundle Identifier
- App Name
- Usage descriptions

### Enable Firebase in iOS

Add to `ios/Podfile`:

```ruby
post_install do |installer|
  installer.pods_project.targets.each do |target|
    flutter_additional_ios_build_settings(target)
    
    # Firebase pods
    target.build_configurations.each do |config|
      config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= [
        '$(inherited)',
        'FIREBASE_ANALYTICS_COLLECTION_ENABLED=YES',
      ]
    end
  end
end
```

---

## 📦 STEP 2: Build iOS App Archive (IPA)

### Build Process

```bash
cd flutter_app

# Clean previous builds
flutter clean

# Get dependencies
flutter pub get

# PrevLeak
flutter build ios --release -t lib/main_prevleak.dart

# SafeRide
flutter build ios --release -t lib/main_saferide.dart

# PaletteMath
flutter build ios --release -t lib/main_palettemath.dart

# Qvedic
flutter build ios --release -t lib/main_qvedic.dart

# Plumber
flutter build ios --release -t lib/main_plumber.dart
```

### Create Archive via Xcode

```bash
# Option 1: Via Flutter (automatic)
cd flutter_app/ios
xcodebuild -workspace Runner.xcworkspace \
    -scheme Runner \
    -configuration Release \
    -archivePath build/Runner.xcarchive \
    archive

# Option 2: Via Xcode GUI
# 1. Open flutter_app/ios/Runner.xcworkspace
# 2. Select Runner project
# 3. Product → Archive
# 4. Wait for build to complete
# 5. Distribute App → App Store Connect
```

**Output**: `build/Runner.xcarchive`

---

## 🚀 STEP 3: Create Apps in App Store Connect

For **EACH brand** (repeat 5 times):

1. Go to: https://appstoreconnect.apple.com
2. Click **My Apps**
3. Click **+ New App**
4. Select:
   - **Platform**: iOS
   - **App Name**: PrevLeak
   - **Bundle ID**: com.prevleakgroup.prevleak
   - **SKU**: prevleak-001 (unique identifier)
5. Click **Create**

---

## 📝 STEP 4: Complete App Store Information

For each app:

### General Information

1. Go to **App Information**
2. Fill in:
   - **Primary Language**: English
   - **App Category**: Navigation, Social, Utilities (varies by brand)
   - **Age Rating**: Complete questionnaire
   - **Copyright**: © 2026 PrevLeak Group
   - **Privacy Policy URL**: https://saferide-peld8.web.app/privacy

### Pricing & Availability

1. Go to **Pricing and Availability**
2. Select:
   - **Pricing Tier**: Free
   - **Availability**: All regions (or selected)
   - **Release Date**: Set date or "As soon as possible"

### App Preview & Screenshots

1. Go to **App Preview**
2. Upload **preview video** (up to 30 seconds):
   - Demo of key features
   - 1242x2688 resolution (iPhone Pro)
   - MP4 format

### Screenshots

1. Go to **Screenshots**
2. Upload for all device types:
   - iPhone 6.5" (e.g., iPhone 14 Pro Max)
   - iPad 12.9"
   - Each needs 1-5 screenshots
   - 1242x2688 for phones, 2048x2732 for iPad
   - PNG or JPG format

**Screenshot Tips**:
- Show key features
- Highlight unique selling points
- Use text overlays
- High quality, professional appearance

### App Description

1. Go to **App Description**
2. Fill in:

**Name** (30 chars):
```
SafeRide - Smart Mobility
```

**Subtitle** (30 chars):
```
AI-Powered Ride Sharing
```

**Description** (4000 chars):
```
SafeRide uses AI and machine learning to provide the safest, most efficient ride-sharing experience.

Features:
• AI-powered ride matching
• Smart route optimization
• Multi-device authentication
• Real-time tracking
• Incident prediction
• Emergency assistance
• Driver verification
• 24/7 customer support

With Firebase backend and Vertex AI, SafeRide delivers enterprise-grade reliability and security.

Contact: support@saferide.company
```

### What's New

1. Go to **What's New**
2. Fill in version notes:
```
Version 1.0.0

🎉 Initial Launch!

Features:
✓ 7-method authentication
✓ AI-powered matching
✓ Real-time webhooks
✓ Secure payment processing
✓ Multi-language support
✓ Offline mode support

Thank you for choosing SafeRide!
```

### Promotional Text

```
Download SafeRide today! AI-powered, secure, reliable. 🚗
```

### Keywords

```
ride sharing, transportation, safety, AI, mobile app
```

### Support URLs

- **Support URL**: https://support.saferide.company
- **Privacy Policy URL**: https://saferide-peld8.web.app/privacy
- **Marketing URL**: https://saferide.company

### Age Rating

1. Click **Age Ratings**
2. Complete questionnaire about content:
   - Violence
   - Alcohol/Tobacco
   - Sexual content
   - etc.
3. Receive rating (4+, 12+, 17+, etc.)

---

## ✅ STEP 5: Submission for Review

### Before Submission Checklist

- [ ] All screenshots uploaded
- [ ] App name finalized
- [ ] Description complete
- [ ] Privacy policy URL set
- [ ] Content rating completed
- [ ] Support URL configured
- [ ] Version number correct (1.0.0)
- [ ] Build uploaded via Xcode
- [ ] All team members have required roles

### Upload Build

1. Open Xcode project: `flutter_app/ios/Runner.xcworkspace`
2. Set scheme to **Runner**
3. Set destination to **Generic iOS Device**
4. Product → Archive
5. After archive completes:
   - Window → Organizer
   - Select latest archive
   - Click **Distribute App**
   - Select **App Store Connect**
   - Select **Upload**
   - Follow prompts to sign and upload

### Submit for Review

1. Go to **Builds** in App Store Connect
2. Select your build
3. Fill in **Phased Release** (optional):
   - 10% → 25% → 50% → 100%
4. Click **Submit for Review**
5. Add review notes (if complex approval needed):
```
This is a ride-sharing application. Uses location and camera permissions for driver verification. 
Connected to Firebase backend. Features real-time tracking and emergency assistance.
Test account: test@saferide.company / Password: Test1234!
```

### Apple Review Process

- **Review time**: 24-48 hours typically
- **Status tracking**: View in App Store Connect → Builds
- **Common rejections**:
  - Missing usage descriptions
  - Privacy policy issues
  - Crash on launch
  - Misleading description
  - Policy violations

---

## 🎯 STEP 6: App Release Strategy

### Option 1: Immediate Release
- App available immediately after approval
- Click **Release**

### Option 2: Phased Release
- Gradual rollout to users
- Start at 10%, increase to 100% over days
- Monitor crashes before full release

### Option 3: Manual Release
- Hold approval, release when ready
- Come back to App Store Connect later
- Click **Release** when ready

---

## 📊 BRAND APP IDS

Configure these:

```
PrevLeak:    com.prevleakgroup.prevleak
SafeRide:    com.saferideinc.saferide
PaletteMath: com.palettemath.colors
Qvedic:      com.qvedic.content
Plumber:     com.plumber.dispatch
```

---

## 🔒 SECURITY & PRIVACY

### Privacy Policy Requirements

Include in privacy policy:
```
Data Collection:
- User location (for ride matching)
- User identity (name, phone, email)
- Payment information (processed securely)
- Device information

Data Sharing:
- Firebase (Google Cloud)
- Payment processor
- Emergency services (if needed)

Retention:
- 90 days (per GDPR)

User Control:
- Delete account (full data deletion)
- Download personal data
- Opt out of analytics
```

### Code Security

- [ ] All API keys in Firebase Configuration only
- [ ] No hardcoded secrets in code
- [ ] HTTPS enforced for all connections
- [ ] Encryption enabled
- [ ] Firebase Security Rules configured
- [ ] User data anonymized where possible

### App Security

- [ ] App Transport Security enabled
- [ ] Certificate pinning implemented
- [ ] Jailbreak detection (optional)
- [ ] Code obfuscation enabled
- [ ] Crashlytics enabled

---

## 🛠️ TROUBLESHOOTING

### Build Fails
```bash
flutter clean
flutter pub get
flutter build ios --release -t lib/main_saferide.dart -v
```

### Archive Creation Fails
1. Update Xcode to latest version
2. Check iOS deployment target (minimum 12.4)
3. Verify all dependencies installed: `pod install`
4. Clean build folder: Cmd+Shift+K

### Upload Fails
1. Verify certificate and provisioning profile are valid
2. Check bundle identifier matches App Store Connect
3. Ensure version number is higher than previous release
4. Review Xcode error messages carefully

### App Crashes on Launch
1. Check Console logs in Xcode
2. Review Firebase Crashlytics dashboard
3. Test on multiple devices/iOS versions
4. Check permissions are requested properly

### App Rejected
1. Read rejection reason carefully
2. Make changes
3. Increment build number
4. Re-upload and resubmit
5. **Do NOT reuse old build**

### Status Stuck in Review
- Max wait: 72 hours
- Contact Apple App Review team via App Store Connect
- Message clearly describing situation

---

## 📞 APPLE SUPPORT

- Documentation: https://developer.apple.com/ios/
- App Store Connect Help: https://help.apple.com/app-store-connect
- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Contact Support: https://developer.apple.com/support/

---

## ✨ POST-LAUNCH

After all 5 brands live on App Store:

1. **Monitor**: Check daily for crashes
2. **Engage**: Respond to reviews promptly
3. **Update**: Push improvements weekly
4. **Market**: Promote on website and social media
5. **Grow**: Build user base through ASO (App Store Optimization)

### App Store Optimization (ASO)

- Keyword research and optimization
- Screenshot A/B testing
- Review reputation management
- Regular updates (keeps app ranked high)

---

## 📈 LAUNCH TIMELINE

```
Week 1:  Prepare certificates and provisioning profiles
Week 2:  Build archives and configure app listings
Week 3:  Submit all 5 brands for review
Week 4:  Receive approvals and release to App Store
```

**All 5 brands can be live on App Store in 1 month!** 🎉

---

**Your SafeRide ecosystem is now ready for global iOS deployment!** 🚀🍎
