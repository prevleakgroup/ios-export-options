# 🤖 ANDROID PLAYSTORE DEPLOYMENT GUIDE

## 5-Brand SafeRide Infrastructure → Google Play Store

**Status**: Production-ready Android builds ready to deploy  
**Firebase Project**: saferide-peld8  
**Brands**: PrevLeak, SafeRide, PaletteMath, Qvedic, Plumber

---

## 📋 PREREQUISITES

### 1. Google Play Developer Account
- Cost: **$25 USD** (one-time)
- Go to: https://play.google.com/console/signup
- Sign in with Google account
- Accept agreements and pay fee
- **Time**: 5 minutes

### 2. App Signing Certificate (Keystore)

Generate signing key for each brand:

```powershell
# PrevLeak
keytool -genkey -v -keystore prevleak-release.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias prevleak
# SafeRide
keytool -genkey -v -keystore saferide-release.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias saferide
# PaletteMath
keytool -genkey -v -keystore palettemath-release.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias palettemath
# Qvedic
keytool -genkey -v -keystore qvedic-release.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias qvedic
# Plumber
keytool -genkey -v -keystore plumber-release.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias plumber
```

**SAVE THESE FILES** - Keep keystores in secure location, NOT in git

### 3. Flutter Project Structure

Your Flutter app should have this structure:

```
flutter_app/
├── android/
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/AndroidManifest.xml
│   ├── app/signing.properties
│   └── gradle.properties
├── ios/
├── lib/
├── pubspec.yaml
└── README.md
```

---

## 🔧 STEP 1: Configure Android Signing

### Create signing.properties

**File**: `flutter_app/android/app/signing.properties`

```properties
storeFile=../keystore/prevleak-release.keystore
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=prevleak
keyPassword=YOUR_KEY_PASSWORD
```

**Repeat for each brand with their respective keystore**

### Update build.gradle

**File**: `flutter_app/android/app/build.gradle`

```gradle
def signingPropertiesFile = rootProject.file("app/signing.properties")
def signingProperties = new Properties()
if (signingPropertiesFile.exists()) {
    signingProperties.load(new FileInputStream(signingPropertiesFile))
}

android {
    compileSdkVersion flutter.compileSdkVersion
    ndkVersion flutter.ndkVersion

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }

    signingConfigs {
        release {
            keyAlias signingProperties['keyAlias']
            keyPassword signingProperties['keyPassword']
            storeFile signingProperties['storeFile'] != null ? file(signingProperties['storeFile']) : null
            storePassword signingProperties['storePassword']
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

---

## 📦 STEP 2: Build Android App Bundle (AAB)

Each brand gets its own AAB:

```bash
cd flutter_app

# PrevLeak
flutter build appbundle --release -t lib/main_prevleak.dart

# SafeRide
flutter build appbundle --release -t lib/main_saferide.dart

# PaletteMath
flutter build appbundle --release -t lib/main_palettemath.dart

# Qvedic
flutter build appbundle --release -t lib/main_qvedic.dart

# Plumber
flutter build appbundle --release -t lib/main_plumber.dart
```

**Output Locations**:
```
build/app/outputs/bundle/release/app-release.aab  # PrevLeak
build/app/outputs/bundle/release/app-release.aab  # SafeRide (etc.)
```

---

## 🚀 STEP 3: Create Apps in Google Play Console

For **EACH brand**:

1. Go to: https://play.google.com/console
2. Click **Create app**
3. Fill in:
   - **App name**: PrevLeak (or respective brand)
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free (or Paid)
4. Click **Create app**

---

## 📝 STEP 4: Complete App Store Listing

For each app in Google Play Console:

### Basic Info
1. Go to **Store listing**
2. Fill in:
   - **App name**: PrevLeak
   - **Short description** (80 chars): "AI-powered threat detection and incident prediction"
   - **Full description** (4000 chars): Full feature description
   - **Screenshots** (2-8 images, 1080x1920 px each)
   - **Feature graphic** (1024x500 px)
   - **Icon** (512x512 px)
   - **Category**: Social / Navigation / Travel (varies by brand)
   - **Content rating**: Fill questionnaire

### Content Rating

1. Go to **Content rating**
2. Fill IARC questionnaire
3. Receive rating certificate

### App Releases

1. Go to **App releases**
2. Click **Create release** → Internal testing
3. Upload AAB file (build/app/outputs/bundle/release/app-release.aab)
4. Fill release notes:
   ```
   v1.0.0 - Initial Production Release
   
   Features:
   - 7-method authentication (Email, Phone, Google, Apple, Facebook, GitHub, Microsoft)
   - Multi-device support with device trust
   - Real-time webhooks and event streams
   - AI/ML workflows with Vertex AI
   - Brand-isolated data architecture
   - Secure secrets management
   
   Fixes:
   - Firebase app initialization optimized
   - Multi-region deployment (US, EU)
   ```
5. Click **Save**

---

## ✅ STEP 5: Privacy & Compliance

### Privacy Policy

1. Go to **App content**
2. Add **Privacy policy URL**:
   ```
   https://saferide-peld8.web.app/privacy-policy
   ```

### Data Safety

1. Go to **Data safety**
2. Fill form about data collection:
   - **Data types collected**: User data, Device data, Location
   - **Data sharing**: Firebase, Google Cloud
   - **Security practices**: HTTPS, Encryption, Regular security tests
3. Click **Save**

### Restricted Content

1. Go to **App content**
2. Confirm no restricted content
3. Verify targeting age appropriate audiences

---

## 📤 STEP 6: Upload to Play Store

### For Internal Testing

1. Go to **Testing** → **Internal testing**
2. Upload AAB file
3. Add testers' Google accounts
4. Testers receive email with install link
5. **Duration**: 2-3 hours for Play Store to process

### For Production Release

1. Once internal testing verified (2-3 days)
2. Go to **App releases** → **Production**
3. Click **Create new release**
4. Upload same AAB file
5. Add release notes
6. **Confirm** and submit

### Google Play Review

- **Review time**: 1-3 hours typically, up to 24 hours
- **Rejection reasons**: If policy violations detected
- **Common rejections**: Misleading description, insufficient content rating, policy violations

---

## 🎯 STEP 7: Monitor & Update

### View App Performance

- Go to **Analytics**
- Monitor: Installs, Crashes, ANRs (Application Not Responding)
- **Crash reporting**: Firebase Crashlytics integration

### Push Updates

```bash
# After code changes, rebuild and re-upload
flutter build appbundle --release -t lib/main_saferide.dart
# Then upload new AAB to Google Play Console
```

### Version Management

Update in `flutter_app/pubspec.yaml`:
```yaml
version: 1.0.0+1  # +1 is build number

# New release:
version: 1.1.0+2  # Increment version
```

---

## 📊 BRAND APP PACKAGE NAMES

Register these in Flutter configuration:

```yaml
# flutter_app/pubspec.yaml
name: prevleakapp
description: PrevLeak - Threat Detection

# Android package name (com.BRAND.company format)
# Set in: flutter_app/android/app/build.gradle

defaultConfig {
    applicationId "com.prevleak.threat"          # PrevLeak
    # or
    applicationId "com.saferide.app"              # SafeRide
    # or
    applicationId "com.palettemath.colors"        # PaletteMath
    # or
    applicationId "com.qvedic.content"            # Qvedic
    # or
    applicationId "com.plumber.dispatch"          # Plumber
}
```

---

## 🔒 SECURITY CHECKLIST

- [ ] Keystores backed up to secure location
- [ ] Keystore passwords stored in password manager
- [ ] No keystores committed to Git
- [ ] Privacy policy URL configured
- [ ] Data safety form completed accurately
- [ ] Content rating obtained
- [ ] Firebase Crashlytics enabled for error reporting
- [ ] API keys restricted to Android apps only
- [ ] Google Play Integrity API enabled for anti-fraud
- [ ] In-app billing testing completed (if using purchases)

---

## 🛠️ TROUBLESHOOTING

### Build Fails
```bash
flutter clean
flutter pub get
flutter build appbundle --release -t lib/main_saferide.dart -v
```

### AAB Upload Rejected
- Check app signing configuration
- Verify AndroidManifest.xml has correct permissions
- Review Google Play Console error messages

### App Crashes After Install
- Check Firebase Console → Crashlytics
- Review logs: `flutter logs -t`
- Test on multiple Android devices

### Update Not Appearing
- Play Store cache delay (24-48 hours)
- User must uninstall and reinstall
- Check staged rollout percentage (start at 10%)

---

## 📞 GOOGLE PLAY SUPPORT

- Documentation: https://developer.android.com/google-play
- Help Center: https://support.google.com/googleplay/android-developer
- Contact: https://play.google.com/console/support

---

## ✨ POST-LAUNCH

After all 5 brands live on Play Store:

1. **Promote**: Share Play Store links on website
2. **Monitor**: Track installs and crashes daily
3. **Update**: Publish improvements weekly
4. **Engage**: Respond to user reviews
5. **Grow**: Build user base through marketing

---

**Your 5 brands will be live on Google Play Store in 1-2 weeks!** 🚀
