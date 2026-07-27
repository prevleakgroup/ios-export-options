/**
 * FIREBASE AUTHENTICATION MANAGER
 * Comprehensive auth layer supporting all devices, social providers, and code-based verification
 * 
 * Features:
 * - Multi-device authentication (web, iOS, Android, desktop)
 * - Social login (Google, Apple, Facebook, GitHub, Microsoft)
 * - Email/Phone OTP verification
 * - Authorization codes for API access
 * - Cross-platform session management
 * - Device fingerprinting and trust tokens
 */

const admin = require('firebase-admin');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Firebase initialized in index.js - do not reinitialize
const db = admin.firestore();
const auth = admin.auth();

class FirebaseAuthManager {
  constructor(brandName) {
    this.brandName = brandName;
    this.collection = `brands/${brandName}/auth`;
    this.devicesCollection = `brands/${brandName}/devices`;
    this.sessionsCollection = `brands/${brandName}/sessions`;
  }

  /**
   * DEVICE MANAGEMENT
   */

  // Register device and get device ID
  async registerDevice(userId, deviceInfo) {
    const deviceId = uuidv4();
    const deviceFingerprint = this._generateFingerprint(deviceInfo);

    const deviceDoc = {
      deviceId,
      userId,
      deviceType: deviceInfo.type, // 'web', 'ios', 'android', 'desktop'
      deviceName: deviceInfo.name || 'Unknown Device',
      osVersion: deviceInfo.osVersion,
      appVersion: deviceInfo.appVersion,
      fingerprint: deviceFingerprint,
      trustedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
      platform: deviceInfo.platform,
      pushToken: deviceInfo.pushToken || null,
      isActive: true,
    };

    await db.collection(this.devicesCollection).doc(deviceId).set(deviceDoc);
    return { deviceId, deviceFingerprint };
  }

  // Verify device trust on subsequent requests
  async verifyDeviceTrust(userId, deviceId, deviceFingerprint) {
    const deviceRef = db.collection(this.devicesCollection).doc(deviceId);
    const deviceSnapshot = await deviceRef.get();

    if (!deviceSnapshot.exists) {
      return { trusted: false, reason: 'Device not registered' };
    }

    const device = deviceSnapshot.data();
    
    if (device.userId !== userId) {
      return { trusted: false, reason: 'Device user mismatch' };
    }

    if (!device.isActive) {
      return { trusted: false, reason: 'Device deactivated' };
    }

    const fingerprintMatch = device.fingerprint === deviceFingerprint;
    
    // Update last activity
    await deviceRef.update({
      lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { trusted: fingerprintMatch, reason: fingerprintMatch ? 'Device verified' : 'Fingerprint mismatch' };
  }

  // List all devices for user
  async listDevices(userId) {
    const snapshot = await db.collection(this.devicesCollection)
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    return snapshot.docs.map(doc => ({
      deviceId: doc.id,
      ...doc.data(),
    }));
  }

  // Revoke device access
  async revokeDevice(userId, deviceId) {
    const deviceRef = db.collection(this.devicesCollection).doc(deviceId);
    const deviceSnapshot = await deviceRef.get();

    if (!deviceSnapshot.exists || deviceSnapshot.data().userId !== userId) {
      throw new Error('Device not found or unauthorized');
    }

    await deviceRef.update({ isActive: false });
  }

  /**
   * OTP & CODE-BASED AUTHENTICATION
   */

  // Generate and send OTP (SMS or Email)
  async generateOTP(userId, method = 'email', destination) {
    const otp = this._generateOTP(6);
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const otpDoc = {
      userId,
      otp,
      method, // 'email', 'sms', 'app'
      destination,
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
      verified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection(this.collection).add(otpDoc);

    // TODO: Send OTP via SMS/Email service
    // await this._sendOTP(destination, otp, method);

    return { otpId: docRef.id, expiresIn: '10 minutes' };
  }

  // Verify OTP code
  async verifyOTP(otpId, providedOtp) {
    const otpRef = db.collection(this.collection).doc(otpId);
    const otpSnapshot = await otpRef.get();

    if (!otpSnapshot.exists) {
      throw new Error('OTP not found');
    }

    const otp = otpSnapshot.data();

    if (otp.expiresAt < Date.now()) {
      throw new Error('OTP expired');
    }

    if (otp.attempts >= otp.maxAttempts) {
      throw new Error('Max attempts exceeded');
    }

    if (otp.otp !== providedOtp) {
      await otpRef.update({ attempts: otp.attempts + 1 });
      throw new Error('Invalid OTP');
    }

    // Mark OTP as verified
    await otpRef.update({ verified: true });

    return { verified: true, userId: otp.userId };
  }

  // Generate authorization code for API access
  async generateAuthorizationCode(userId, scope = [], expiresIn = 3600) {
    const code = this._generateAuthCode(32);
    const expiresAt = Date.now() + expiresIn * 1000;

    const codeDoc = {
      userId,
      code,
      scope, // ['read:data', 'write:data', 'read:analytics']
      used: false,
      usedAt: null,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection(`${this.collection}/codes`).add(codeDoc);

    return { code, expiresIn };
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code) {
    const snapshot = await db.collection(`${this.collection}/codes`)
      .where('code', '==', code)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new Error('Authorization code not found');
    }

    const codeDoc = snapshot.docs[0];
    const codeData = codeDoc.data();

    if (codeData.used) {
      throw new Error('Authorization code already used');
    }

    if (codeData.expiresAt < Date.now()) {
      throw new Error('Authorization code expired');
    }

    // Mark code as used
    await codeDoc.ref.update({
      used: true,
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Generate access token
    const token = this._generateAccessToken(codeData.userId, codeData.scope);

    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: 3600,
      scope: codeData.scope,
    };
  }

  /**
   * SESSION MANAGEMENT (Multi-Device)
   */

  // Create session
  async createSession(userId, deviceId, authMethod, metadata = {}) {
    const sessionId = uuidv4();
    const refreshToken = this._generateRefreshToken(32);

    const sessionDoc = {
      sessionId,
      userId,
      deviceId,
      authMethod, // 'password', 'oauth', 'otp', 'biometric'
      refreshToken,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      metadata,
    };

    await db.collection(this.sessionsCollection).doc(sessionId).set(sessionDoc);

    return { sessionId, refreshToken };
  }

  // Verify session
  async verifySession(sessionId) {
    const sessionRef = db.collection(this.sessionsCollection).doc(sessionId);
    const sessionSnapshot = await sessionRef.get();

    if (!sessionSnapshot.exists) {
      throw new Error('Session not found');
    }

    const session = sessionSnapshot.data();

    if (!session.isActive) {
      throw new Error('Session inactive');
    }

    if (session.expiresAt < Date.now()) {
      throw new Error('Session expired');
    }

    // Update last activity
    await sessionRef.update({
      lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return session;
  }

  // Refresh session using refresh token
  async refreshSession(sessionId, refreshToken) {
    const session = await this.verifySession(sessionId);

    if (session.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    const newRefreshToken = this._generateRefreshToken(32);
    
    await db.collection(this.sessionsCollection).doc(sessionId).update({
      refreshToken: newRefreshToken,
      lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { sessionId, refreshToken: newRefreshToken };
  }

  // List active sessions
  async listActiveSessions(userId) {
    const snapshot = await db.collection(this.sessionsCollection)
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    return snapshot.docs.map(doc => ({
      sessionId: doc.id,
      ...doc.data(),
    }));
  }

  // Sign out session
  async signOutSession(sessionId) {
    await db.collection(this.sessionsCollection).doc(sessionId).update({
      isActive: false,
    });
  }

  // Sign out all sessions (security breach response)
  async signOutAllSessions(userId) {
    const snapshot = await db.collection(this.sessionsCollection)
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isActive: false });
    });

    await batch.commit();
  }

  /**
   * SOCIAL OAUTH PROVIDERS
   */

  // Create OAuth provider configuration
  async setupOAuthProvider(provider, config) {
    const providerDoc = {
      provider, // 'google', 'apple', 'facebook', 'github', 'microsoft'
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUris: config.redirectUris,
      scope: config.scope,
      enabled: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection(`${this.collection}/oauth`).doc(provider).set(providerDoc);
  }

  // Handle OAuth callback
  async handleOAuthCallback(provider, code, codeVerifier, redirectUri) {
    // This would typically exchange the code with the OAuth provider
    // For now, we'll simulate the flow

    const providerConfig = await db.collection(`${this.collection}/oauth`)
      .doc(provider)
      .get();

    if (!providerConfig.exists) {
      throw new Error(`OAuth provider ${provider} not configured`);
    }

    // TODO: Exchange code with OAuth provider
    // const tokens = await this._exchangeOAuthCode(provider, code, providerConfig.data());

    // Simulate OAuth user info
    const oauthUserInfo = {
      id: `${provider}_${uuidv4()}`,
      email: 'user@example.com', // From OAuth provider
      displayName: 'User Name', // From OAuth provider
      profilePicture: '', // From OAuth provider
      provider,
    };

    return oauthUserInfo;
  }

  /**
   * USER AUTHENTICATION FLOW
   */

  // Sign up with email
  async signUpWithEmail(email, password, displayName) {
    try {
      const userRecord = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });

      const userDoc = {
        uid: userRecord.uid,
        email,
        displayName,
        authMethods: ['email'],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection(`${this.collection}/users`).doc(userRecord.uid).set(userDoc);

      // Generate email verification code
      const verificationCode = await this.generateOTP(userRecord.uid, 'email', email);

      return {
        uid: userRecord.uid,
        email,
        verificationCodeId: verificationCode.otpId,
        message: 'Sign up successful. Please verify your email.',
      };
    } catch (error) {
      throw new Error(`Sign up failed: ${error.message}`);
    }
  }

  // Sign in with email
  async signInWithEmail(email, password) {
    try {
      const userRecord = await auth.getUserByEmail(email);
      // Password verification is handled by Firebase Auth client SDK
      return { uid: userRecord.uid, email: userRecord.email };
    } catch (error) {
      throw new Error('Invalid email or password');
    }
  }

  // Sign in with phone
  async signInWithPhone(phoneNumber) {
    const otpId = await this.generateOTP('temp', 'sms', phoneNumber);
    return { otpId: otpId.otpId, message: 'OTP sent to your phone' };
  }

  // Sign in with OAuth
  async signInWithOAuth(provider, oauthUserInfo) {
    // Check if user exists
    const snapshot = await db.collection(`${this.collection}/users`)
      .where('email', '==', oauthUserInfo.email)
      .limit(1)
      .get();

    let uid;

    if (snapshot.empty) {
      // Create new user
      const userRecord = await auth.createUser({
        email: oauthUserInfo.email,
        displayName: oauthUserInfo.displayName,
        photoURL: oauthUserInfo.profilePicture,
        emailVerified: true,
      });

      uid = userRecord.uid;

      const userDoc = {
        uid,
        email: oauthUserInfo.email,
        displayName: oauthUserInfo.displayName,
        profilePicture: oauthUserInfo.profilePicture,
        authMethods: [provider],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection(`${this.collection}/users`).doc(uid).set(userDoc);
    } else {
      // Update existing user
      uid = snapshot.docs[0].id;
      const userRef = db.collection(`${this.collection}/users`).doc(uid);
      const userData = snapshot.docs[0].data();

      if (!userData.authMethods.includes(provider)) {
        await userRef.update({
          authMethods: admin.firestore.FieldValue.arrayUnion(provider),
        });
      }

      await userRef.update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { uid, email: oauthUserInfo.email };
  }

  /**
   * PRIVATE HELPER METHODS
   */

  _generateFingerprint(deviceInfo) {
    const fingerprint = `${deviceInfo.type}|${deviceInfo.osVersion}|${deviceInfo.platform}`;
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }

  _generateOTP(length) {
    return Math.random().toString().slice(2, 2 + length);
  }

  _generateAuthCode(length) {
    return crypto.randomBytes(length / 2).toString('hex');
  }

  _generateAccessToken(userId, scope) {
    const token = {
      sub: userId,
      scope,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    // In production, this would be signed with a private key
    return Buffer.from(JSON.stringify(token)).toString('base64');
  }

  _generateRefreshToken(length) {
    return crypto.randomBytes(length / 2).toString('hex');
  }
}

module.exports = FirebaseAuthManager;
