# MULTI-DEVICE, MULTI-SOCIAL AUTHENTICATION GUIDE

## Overview

Complete authentication system supporting:
- ✅ Email/Password authentication
- ✅ Phone OTP authentication
- ✅ Social OAuth (Google, Apple, Facebook, GitHub, Microsoft)
- ✅ Multi-device management
- ✅ Session management
- ✅ Authorization codes
- ✅ Cross-platform support (Web, iOS, Android, Desktop)

---

## AUTHENTICATION FLOWS

### 1. EMAIL & PASSWORD SIGNUP

**Endpoint:** `POST /auth/signup/email?brand=palettemath`

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "uid": "user123",
  "email": "user@example.com",
  "verificationCodeId": "otp123",
  "message": "Sign up successful. Please verify your email."
}
```

---

### 2. EMAIL & PASSWORD SIGNIN

**Endpoint:** `POST /auth/signin/email?brand=palettemath`

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "brand": "palettemath"
}
```

**Response:**
```json
{
  "uid": "user123",
  "email": "user@example.com",
  "message": "Sign in successful. Get ID token from Firebase Auth."
}
```

**Client SDK:** After receiving `uid`, use Firebase Auth to get ID token:
```javascript
// Web/JS
firebase.auth().signInWithEmailAndPassword(email, password)
  .then(userCredential => {
    const idToken = userCredential.user.getIdToken();
  });
```

---

### 3. PHONE OTP AUTHENTICATION

**Step 1: Request OTP**

**Endpoint:** `POST /auth/signin/phone`

```json
{
  "phoneNumber": "+27123456789"
}
```

**Response:**
```json
{
  "otpId": "otp_abc123",
  "message": "OTP sent to your phone"
}
```

**Step 2: Verify OTP**

**Endpoint:** `POST /auth/otp/verify`

```json
{
  "otpId": "otp_abc123",
  "code": "123456"
}
```

**Response:**
```json
{
  "verified": true,
  "userId": "user123"
}
```

---

### 4. SOCIAL LOGIN (OAUTH)

#### Google Sign-In

**Web Implementation:**
```html
<button onclick="signInWithGoogle()">Sign in with Google</button>

<script>
function signInWithGoogle() {
  firebase.auth()
    .signInWithPopup(new firebase.auth.GoogleAuthProvider())
    .then(result => {
      const credential = result.credential;
      const accessToken = credential.accessToken;
      
      // Exchange for authorization code
      fetch('/auth/signin/oauth?brand=palettemath', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          code: result.user.uid, // or actual OAuth code
          redirectUri: window.location.origin
        })
      });
    });
}
</script>
```

**Mobile (iOS/Android):**

iOS with GoogleSignIn SDK:
```swift
GIDSignIn.sharedInstance.signIn(withPresenting: self) { signInResult, error in
  guard let result = signInResult else { return }
  
  let credential = GoogleAuthProvider.credential(
    withIDToken: result.user.idToken?.tokenString ?? "",
    accessToken: result.user.accessToken.tokenString
  )
  
  Auth.auth().signIn(with: credential) { authResult, error in
    // Handle sign-in
  }
}
```

Android with Google Sign-In:
```kotlin
val googleSignInClient = GoogleSignIn.getClient(activity, gso)

googleSignInClient.signOut().addOnCompleteListener {
  val signInIntent = googleSignInClient.signInIntent
  startActivityForResult(signInIntent, RC_SIGN_IN)
}

// In onActivityResult:
val task = GoogleSignIn.getSignedInAccountFromIntent(data)
val account = task.getResult(ApiException::class.java)
val credential = GoogleAuthProvider.getCredential(account.idToken!!, null)
Auth.auth().signInWithCredential(credential)
  .addOnCompleteListener { task ->
    // Handle sign-in
  }
```

**Supported OAuth Providers:**
- Google
- Apple
- Facebook
- GitHub
- Microsoft

---

## MULTI-DEVICE MANAGEMENT

### Register Device

**Endpoint:** `POST /auth/device/register`

**Headers:** `Authorization: Bearer {idToken}`

```json
{
  "deviceInfo": {
    "type": "web",
    "name": "Chrome on MacBook",
    "osVersion": "14.0",
    "appVersion": "1.0.0",
    "platform": "darwin",
    "pushToken": "fcm_token_xyz"
  }
}
```

**Response:**
```json
{
  "deviceId": "device_123",
  "deviceFingerprint": "sha256_hash"
}
```

### List All Devices

**Endpoint:** `GET /auth/devices`

**Headers:** `Authorization: Bearer {idToken}`

**Response:**
```json
{
  "devices": [
    {
      "deviceId": "device_123",
      "deviceName": "Chrome on MacBook",
      "deviceType": "web",
      "lastActivityAt": "2026-07-27T19:30:00Z",
      "trustedAt": "2026-07-20T10:15:00Z"
    },
    {
      "deviceId": "device_456",
      "deviceName": "Safari on iPhone",
      "deviceType": "ios",
      "lastActivityAt": "2026-07-27T18:45:00Z",
      "trustedAt": "2026-07-25T14:20:00Z"
    }
  ]
}
```

### Revoke Device Access

**Endpoint:** `DELETE /auth/device/{deviceId}`

**Headers:** `Authorization: Bearer {idToken}`

**Response:**
```json
{
  "message": "Device revoked"
}
```

---

## SESSION MANAGEMENT

### Create Session

**Endpoint:** `POST /auth/session/create`

**Headers:** `Authorization: Bearer {idToken}`

```json
{
  "deviceId": "device_123",
  "authMethod": "password"
}
```

**Response:**
```json
{
  "sessionId": "session_abc",
  "refreshToken": "refresh_token_xyz"
}
```

### Refresh Session

**Endpoint:** `POST /auth/session/refresh`

**Headers:** `Authorization: Bearer {idToken}`

```json
{
  "sessionId": "session_abc",
  "refreshToken": "refresh_token_xyz"
}
```

**Response:**
```json
{
  "sessionId": "session_abc",
  "refreshToken": "new_refresh_token_123"
}
```

### List Active Sessions

**Endpoint:** `GET /auth/sessions`

**Headers:** `Authorization: Bearer {idToken}`

**Response:**
```json
{
  "sessions": [
    {
      "sessionId": "session_abc",
      "deviceId": "device_123",
      "authMethod": "password",
      "createdAt": "2026-07-27T19:00:00Z",
      "lastActivityAt": "2026-07-27T19:30:00Z"
    }
  ]
}
```

### Sign Out Session

**Endpoint:** `POST /auth/signout`

**Headers:** `Authorization: Bearer {idToken}`

```json
{
  "sessionId": "session_abc"
}
```

### Sign Out All Sessions

**Endpoint:** `POST /auth/signout-all`

**Headers:** `Authorization: Bearer {idToken}`

**Response:**
```json
{
  "message": "All sessions signed out"
}
```

---

## AUTHORIZATION CODES & API ACCESS

### Generate Authorization Code

**Endpoint:** `POST /auth/code/authorization`

**Headers:** `Authorization: Bearer {idToken}`

```json
{
  "scope": ["read:data", "write:data"],
  "expiresIn": 3600
}
```

**Response:**
```json
{
  "code": "auth_code_abc123xyz",
  "expiresIn": 3600
}
```

### Exchange Code for Token

**Endpoint:** `POST /auth/token/exchange`

```json
{
  "code": "auth_code_abc123xyz"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "scope": ["read:data", "write:data"]
}
```

---

## SUPPORTED BRANDS

All authentication flows work with brand isolation:

- `?brand=palettemath`
- `?brand=saferide`
- `?brand=prevleak`
- `?brand=qvedic`
- `?brand=plumber`

**Example:** `POST /auth/signin/email?brand=saferide`

---

## CLIENT SDK INTEGRATION

### Web (JavaScript)

```javascript
// Initialize Firebase
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Email signup
createUserWithEmailAndPassword(auth, email, password)
  .then(userCredential => {
    const user = userCredential.user;
    console.log("Signed up:", user.uid);
  })
  .catch(error => console.error(error));

// Google sign-in
const provider = new GoogleAuthProvider();
signInWithPopup(auth, provider)
  .then(result => {
    const user = result.user;
    console.log("Signed in with Google:", user.uid);
  })
  .catch(error => console.error(error));
```

### iOS (Swift)

```swift
import FirebaseAuth

// Email signup
Auth.auth().createUser(withEmail: email, password: password) { authResult, error in
  guard let user = authResult?.user else { return }
  print("Signed up: \(user.uid)")
}

// Sign in
Auth.auth().signIn(withEmail: email, password: password) { authResult, error in
  guard let user = authResult?.user else { return }
  print("Signed in: \(user.uid)")
}
```

### Android (Kotlin)

```kotlin
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.ktx.auth
import com.google.firebase.ktx.Firebase

val auth = Firebase.auth

// Email signup
auth.createUserWithEmailAndPassword(email, password)
  .addOnCompleteListener { task ->
    if (task.isSuccessful) {
      val user = auth.currentUser
      Log.d("Auth", "Signed up: ${user?.uid}")
    }
  }

// Sign in
auth.signInWithEmailAndPassword(email, password)
  .addOnCompleteListener { task ->
    if (task.isSuccessful) {
      val user = auth.currentUser
      Log.d("Auth", "Signed in: ${user?.uid}")
    }
  }
```

---

## SECURITY BEST PRACTICES

1. **Always use HTTPS** for auth endpoints
2. **Store tokens securely:**
   - Web: HttpOnly cookies (not localStorage)
   - iOS: Keychain
   - Android: EncryptedSharedPreferences
3. **Validate device fingerprint** on each request
4. **Implement rate limiting** on OTP/auth attempts
5. **Use strong passwords** (minimum 8 characters)
6. **Enable 2FA** for sensitive accounts
7. **Revoke unused devices** regularly
8. **Monitor active sessions** for suspicious activity

---

## ERROR HANDLING

### Common Status Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 200 | Success | Proceed |
| 400 | Bad Request | Check parameters |
| 401 | Unauthorized | Provide valid token/credentials |
| 403 | Forbidden | Insufficient permissions |
| 423 | Identity Re-verification Required | Complete re-verification flow |
| 500 | Server Error | Retry after delay |

---

## TESTING ENDPOINTS

### Postman Collection

```json
{
  "info": { "name": "Authentication API" },
  "item": [
    {
      "name": "Sign Up",
      "request": {
        "method": "POST",
        "url": "https://saferide-peld8.web.app/auth/signup/email?brand=palettemath",
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"displayName\":\"Test User\"}"
        }
      }
    },
    {
      "name": "Sign In",
      "request": {
        "method": "POST",
        "url": "https://saferide-peld8.web.app/auth/signin/email?brand=palettemath",
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"test@example.com\",\"password\":\"Test123!\"}"
        }
      }
    }
  ]
}
```

---

## NEXT STEPS

1. ✅ Authentication system complete and ready to deploy
2. ⏳ **Waiting for Firebase deployment credentials**
3. 🚀 Deploy to `saferide-peld8` project
4. 🧪 Test all auth flows in staging environment
5. 📱 Integrate SDKs in mobile apps
6. 🌐 Add auth pages to web portals

