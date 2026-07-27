# App Store + GoDaddy DNS + Port 8080 Integration

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  Apple App Store & Google Play Store                 │
│  (iOS + Android App Listings)                        │
└──────────────┬───────────────────────────────────────┘
               │
               │ Deep Links & API Calls
               ↓
┌──────────────────────────────────────────────────────┐
│  GoDaddy DNS for App Store Subdomains                │
│  • apps.prevleak.company                             │
│  • apps.saferide.company                             │
│  • apps.palettemath.company                          │
│  • apps.qvedic.company                               │
└──────────────┬───────────────────────────────────────┘
               │
               │ HTTPS to Port 8080
               ↓
┌──────────────────────────────────────────────────────┐
│  Port 8080 Gateway (Your Running Code)               │
│  • App authentication                                │
│  • App configuration endpoints                       │
│  • In-app purchase verification                      │
│  • Deep link handling                                │
│  • App analytics                                     │
└──────────────┬───────────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────────┐
│  Firebase Backend                                    │
│  • Firestore Database                                │
│  • Cloud Functions                                   │
│  • Authentication                                    │
└──────────────────────────────────────────────────────┘
```

---

## **GoDaddy DNS Configuration for App Store**

### In GoDaddy DNS Settings (for each domain):

#### PrevLeak (prevleak.company)
```
Type: A
Name: apps
Value: [Your Port 8080 IP Address]

Type: CNAME
Name: app-api
Value: [Your Port 8080 Hostname]

Type: TXT
Name: _acme-challenge.apps
Value: [SSL certificate verification token]
```

#### Saferide (saferide.company)
```
Type: A
Name: apps
Value: [Your Port 8080 IP Address]

Type: CNAME
Name: app-api
Value: [Your Port 8080 Hostname]
```

#### Palettemath (palettemath.company)
```
Type: A
Name: apps
Value: [Your Port 8080 IP Address]

Type: CNAME
Name: app-api
Value: [Your Port 8080 Hostname]
```

#### Qvedic (qvedic.company)
```
Type: A
Name: apps
Value: [Your Port 8080 IP Address]

Type: CNAME
Name: app-api
Value: [Your Port 8080 Hostname]
```

---

## **App Store Deep Links Configuration**

### iOS Deep Links (in app code):

```swift
// App Store listing deep link
let appStoreUrl = "https://apps.prevleak.company/ios"

// In-app deep link handling
func handleDeepLink(url: URL) {
    if url.scheme == "com.prevleak" {
        // Handle app-internal links
        navigateTo(url.path)
    } else if url.host?.contains("prevleak.company") == true {
        // Handle web-to-app links from GoDaddy/port 8080
        let endpoint = url.path
        fetchFromPort8080(endpoint: endpoint)
    }
}

// Request from port 8080 endpoint
func fetchFromPort8080(endpoint: String) {
    let url = URL(string: "https://apps.prevleak.company:8080/app/\(endpoint)")!
    
    URLSession.shared.dataTask(with: url) { data, response, error in
        if let data = data {
            // Handle response from port 8080
            processAppData(data)
        }
    }.resume()
}
```

### Android Deep Links (AndroidManifest.xml):

```xml
<activity android:name=".MainActivity">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        
        <!-- Deep links from App Store deep link -->
        <data android:scheme="https"
              android:host="apps.prevleak.company"
              android:pathPrefix="/android" />
        
        <!-- App-internal deep links -->
        <data android:scheme="com.prevleak" />
    </intent-filter>
</activity>
```

Handle in Activity:
```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Handle deep link from intent
    val appLinkIntent = intent
    val appLinkAction = appLinkIntent.action
    val appLinkData = appLinkIntent.data
    
    if (appLinkAction == Intent.ACTION_VIEW) {
        when {
            appLinkData?.host?.contains("prevleak.company") == true -> {
                // Deep link from GoDaddy / port 8080
                handleWebDeepLink(appLinkData.toString())
            }
            appLinkData?.scheme == "com.prevleak" -> {
                // App-internal deep link
                handleAppDeepLink(appLinkData.toString())
            }
        }
    }
}

private fun handleWebDeepLink(url: String) {
    // Make request to port 8080
    val request = Request.Builder()
        .url(url.replace("https://apps", "https://api"))
        .build()
    
    client.newCall(request).enqueue(object : Callback {
        override fun onResponse(call: Call, response: Response) {
            val data = response.body?.string()
            // Process response
        }
    })
}
```

---

## **Port 8080 App Store Endpoints**

Create these endpoints in your port 8080 gateway:

```javascript
// port-8080-gateway.js

// iOS App Configuration
app.get('/app/ios/config', (req, res) => {
  res.json({
    appVersion: '1.0.0',
    minSupportedVersion: '1.0.0',
    updateRequired: false,
    appStoreUrl: 'https://apps.apple.com/app/prevleak/id123456789',
    features: {
      push: true,
      analytics: true,
      offlineMode: false
    }
  });
});

// Android App Configuration
app.get('/app/android/config', (req, res) => {
  res.json({
    appVersion: '1.0.0',
    minSupportedVersion: '1.0.0',
    updateRequired: false,
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.prevleak',
    features: {
      push: true,
      analytics: true,
      offlineMode: false
    }
  });
});

// Deep link handler
app.post('/app/deeplink/:brand', (req, res) => {
  const { brand } = req.params;
  const { path, data } = req.body;
  
  // Process deep link request
  console.log(`Deep link for ${brand}: ${path}`, data);
  
  // Return appropriate response based on path
  res.json({
    success: true,
    action: path,
    data: data
  });
});

// In-app purchase verification
app.post('/app/iap/verify', (req, res) => {
  const { transactionId, productId, platform } = req.body;
  
  if (platform === 'ios') {
    // Verify with Apple
    verifyAppleReceipt(transactionId, productId);
  } else if (platform === 'android') {
    // Verify with Google
    verifyGooglePlayReceipt(transactionId, productId);
  }
  
  res.json({ verified: true });
});

// App version check
app.get('/app/:brand/version', (req, res) => {
  const { brand } = req.params;
  const { platform } = req.query;
  
  const versions = {
    prevleak: { ios: '1.0.5', android: '1.0.5' },
    saferide: { ios: '2.1.0', android: '2.1.0' },
    palettemath: { ios: '1.2.3', android: '1.2.3' },
    qvedic: { ios: '1.0.0', android: '1.0.0' }
  };
  
  res.json({
    version: versions[brand]?.[platform] || '1.0.0',
    updateAvailable: false,
    criticalUpdate: false
  });
});

// App analytics endpoint
app.post('/app/:brand/analytics', (req, res) => {
  const { brand } = req.params;
  const { event, properties } = req.body;
  
  // Log analytics event
  console.log(`[${brand}] Event: ${event}`, properties);
  
  res.json({ logged: true });
});

// App authentication
app.post('/app/auth/login', async (req, res) => {
  const { email, password, platform } = req.body;
  
  try {
    const user = await authenticateUser(email, password);
    const token = generateAppToken(user, platform);
    
    res.json({
      success: true,
      token: token,
      user: user
    });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});
```

---

## **App Store Listing Configuration**

### iOS - App Store Connect:

**Privacy Policy URL:**
```
https://apps.prevleak.company/ios/privacy
```

**Support URL:**
```
https://apps.prevleak.company/ios/support
```

**Website URL:**
```
https://prevleak.company
```

**Universal Links (Associated Domains):**
```
applinks:apps.prevleak.company
```

In `apple-app-site-association` (at port 8080):
```json
{
  "applinks": {
    "apps": [
      {
        "appID": "TEAM_ID.com.prevleak",
        "paths": [ "/ios/*" ]
      }
    ]
  },
  "webcredentials": {
    "apps": [
      {
        "appID": "TEAM_ID.com.prevleak"
      }
    ]
  }
}
```

### Android - Google Play Console:

**Store Listing URL:**
```
https://apps.saferide.company/android
```

**Support Email:**
```
support@saferide.company
```

**Support URL:**
```
https://apps.saferide.company/android/support
```

**App Links (assetlinks.json at port 8080):**
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.saferide",
      "sha256_cert_fingerprints": ["AA:BB:CC:DD:..."]
    }
  }
]
```

---

## **SSL/HTTPS Certificate for Port 8080**

For app store deep links to work, port 8080 must have valid SSL:

### Using Let's Encrypt (Free):
```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate for app store subdomains
sudo certbot certonly -d apps.prevleak.company \
                      -d apps.saferide.company \
                      -d apps.palettemath.company \
                      -d apps.qvedic.company

# Update port 8080 gateway to use certificate
```

### Node.js with SSL:
```javascript
const https = require('https');
const fs = require('fs');
const express = require('express');

const app = express();

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/apps.prevleak.company/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/apps.prevleak.company/fullchain.pem')
};

https.createServer(options, app).listen(8080, () => {
  console.log('✓ Port 8080 running with HTTPS');
});
```

---

## **Testing App Store Integration**

### Test iOS Deep Link:
```bash
# Simulate app store deep link
curl -X POST https://apps.prevleak.company:8080/app/deeplink/prevleak \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/onboarding",
    "data": {"step": 1}
  }'
```

### Test Android Deep Link:
```bash
# Simulate play store deep link
curl -X POST https://apps.saferide.company:8080/app/deeplink/saferide \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/driver-signup",
    "data": {"referral": "play-store"}
  }'
```

### Check App Configuration:
```bash
curl https://apps.prevleak.company:8080/app/ios/config
curl https://apps.saferide.company:8080/app/android/config
```

---

## **Deployment Checklist - App Store Integration**

- [ ] Configure GoDaddy DNS for `apps.` subdomains
- [ ] Create port 8080 app store endpoints
- [ ] Generate SSL certificates for port 8080
- [ ] Set up `apple-app-site-association` for iOS
- [ ] Set up `assetlinks.json` for Android
- [ ] Update iOS app with Universal Links configuration
- [ ] Update Android app with Deep Link configuration
- [ ] Test deep links from app store listings
- [ ] Verify app-to-backend communication
- [ ] Monitor analytics from port 8080 endpoints

---

## **Summary**

| Layer | Endpoint | Function |
|-------|----------|----------|
| **App Store** | App Store/Play Store | User installs app |
| **GoDaddy DNS** | `apps.*.company` | Routes app traffic to port 8080 |
| **Port 8080** | `https://apps.*/app/*` | Handles app configuration, deep links, IAP |
| **Firebase** | Backend | Database & services for app |

**Result:** Apps connect securely to your running code via GoDaddy DNS + port 8080, with all source code kept private.
