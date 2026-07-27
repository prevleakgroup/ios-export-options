/**
 * AUTHENTICATION API ENDPOINTS
 * Exposes all auth flows across web, mobile, social, OTP, and code-based auth
 * 
 * Routes:
 * POST /auth/signup/email - Sign up with email
 * POST /auth/signin/email - Sign in with email
 * POST /auth/signin/phone - Sign in with phone OTP
 * POST /auth/signin/oauth - Sign in with OAuth provider
 * POST /auth/otp/verify - Verify OTP code
 * POST /auth/device/register - Register new device
 * POST /auth/session/create - Create authenticated session
 * POST /auth/session/refresh - Refresh session token
 * GET /auth/sessions - List all active sessions
 * POST /auth/signout - Sign out current session
 * POST /auth/signout-all - Sign out all sessions
 */

const express = require('express');
const admin = require('firebase-admin');
const FirebaseAuthManager = require('./firebase-auth-manager');

const router = express.Router();
const db = admin.firestore();

/**
 * Middleware: Get brand from request
 */
router.use((req, res, next) => {
  const brand = req.query.brand || req.body.brand || 'default';
  req.authManager = new FirebaseAuthManager(brand);
  next();
});

/**
 * Middleware: Verify Firebase ID token
 */
async function verifyToken(req, res, next) {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer (.+)$/i);

  if (!match) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(match[1]);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * SIGNUP & SIGNIN ENDPOINTS
 */

// POST /auth/signup/email
router.post('/signup/email', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password, and displayName required' });
    }

    const result = await req.authManager.signUpWithEmail(email, password, displayName);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /auth/signin/email
router.post('/signin/email', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await req.authManager.signInWithEmail(email, password);
    
    // Generate custom claims for brand isolation
    await admin.auth().setCustomUserClaims(user.uid, {
      brand: req.body.brand || 'default',
      role: 'user',
    });

    res.json({
      uid: user.uid,
      email: user.email,
      message: 'Sign in successful. Get ID token from Firebase Auth.',
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// POST /auth/signin/phone
router.post('/signin/phone', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    const result = await req.authManager.signInWithPhone(phoneNumber);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /auth/signin/oauth
router.post('/signin/oauth', async (req, res) => {
  try {
    const { provider, code, codeVerifier, redirectUri } = req.body;

    if (!provider || !code) {
      return res.status(400).json({ error: 'Provider and code required' });
    }

    const oauthUserInfo = await req.authManager.handleOAuthCallback(
      provider,
      code,
      codeVerifier,
      redirectUri
    );

    const user = await req.authManager.signInWithOAuth(provider, oauthUserInfo);

    res.json({
      uid: user.uid,
      email: user.email,
      provider,
      message: 'OAuth sign in successful',
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * OTP & CODE VERIFICATION
 */

// POST /auth/otp/generate
router.post('/otp/generate', async (req, res) => {
  try {
    const { userId, method, destination } = req.body;

    if (!userId || !method || !destination) {
      return res.status(400).json({ error: 'userId, method, and destination required' });
    }

    const result = await req.authManager.generateOTP(userId, method, destination);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /auth/otp/verify
router.post('/otp/verify', async (req, res) => {
  try {
    const { otpId, code } = req.body;

    if (!otpId || !code) {
      return res.status(400).json({ error: 'OTP ID and code required' });
    }

    const result = await req.authManager.verifyOTP(otpId, code);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /auth/code/authorization
router.post('/code/authorization', verifyToken, async (req, res) => {
  try {
    const { scope, expiresIn } = req.body;

    const result = await req.authManager.generateAuthorizationCode(
      req.user.uid,
      scope || [],
      expiresIn || 3600
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /auth/token/exchange
router.post('/token/exchange', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    const result = await req.authManager.exchangeCodeForToken(code);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DEVICE MANAGEMENT
 */

// POST /auth/device/register
router.post('/device/register', verifyToken, async (req, res) => {
  try {
    const { deviceInfo } = req.body;

    if (!deviceInfo) {
      return res.status(400).json({ error: 'Device info required' });
    }

    const result = await req.authManager.registerDevice(req.user.uid, deviceInfo);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /auth/device/verify
router.post('/device/verify', verifyToken, async (req, res) => {
  try {
    const { deviceId, deviceFingerprint } = req.body;

    if (!deviceId || !deviceFingerprint) {
      return res.status(400).json({ error: 'Device ID and fingerprint required' });
    }

    const result = await req.authManager.verifyDeviceTrust(
      req.user.uid,
      deviceId,
      deviceFingerprint
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /auth/devices
router.get('/devices', verifyToken, async (req, res) => {
  try {
    const devices = await req.authManager.listDevices(req.user.uid);
    res.json({ devices });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /auth/device/:deviceId
router.delete('/device/:deviceId', verifyToken, async (req, res) => {
  try {
    await req.authManager.revokeDevice(req.user.uid, req.params.deviceId);
    res.json({ message: 'Device revoked' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * SESSION MANAGEMENT
 */

// POST /auth/session/create
router.post('/session/create', verifyToken, async (req, res) => {
  try {
    const { deviceId, authMethod } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID required' });
    }

    const result = await req.authManager.createSession(
      req.user.uid,
      deviceId,
      authMethod || 'password'
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /auth/session/refresh
router.post('/session/refresh', verifyToken, async (req, res) => {
  try {
    const { sessionId, refreshToken } = req.body;

    if (!sessionId || !refreshToken) {
      return res.status(400).json({ error: 'Session ID and refresh token required' });
    }

    const result = await req.authManager.refreshSession(sessionId, refreshToken);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /auth/sessions
router.get('/sessions', verifyToken, async (req, res) => {
  try {
    const sessions = await req.authManager.listActiveSessions(req.user.uid);
    res.json({ sessions });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /auth/signout
router.post('/signout', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    await req.authManager.signOutSession(sessionId);
    res.json({ message: 'Signed out' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /auth/signout-all
router.post('/signout-all', verifyToken, async (req, res) => {
  try {
    await req.authManager.signOutAllSessions(req.user.uid);
    res.json({ message: 'All sessions signed out' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * OAUTH CONFIGURATION
 */

// POST /auth/oauth/setup
router.post('/oauth/setup', async (req, res) => {
  try {
    const { provider, clientId, clientSecret, redirectUris, scope } = req.body;

    if (!provider || !clientId) {
      return res.status(400).json({ error: 'Provider and clientId required' });
    }

    await req.authManager.setupOAuthProvider(provider, {
      clientId,
      clientSecret,
      redirectUris: redirectUris || [],
      scope: scope || [],
    });

    res.json({ message: `OAuth provider ${provider} configured` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
