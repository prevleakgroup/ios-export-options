const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { onRequest } = require('firebase-functions/v2/https');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const SELF_SERVICE_ROLES = new Set(['rider', 'driver', 'customer']);
const SESSION_TTL_MS = 4 * 60 * 60 * 1000;
const RECENT_AUTH_SECONDS = 5 * 60;
const MAX_DAILY_SHIFT_MS = 16 * 60 * 60 * 1000;
const FACE_REVERIFICATION_REASONS = new Set([
  'account_takeover_signal',
  'identity_mismatch',
  'payment_risk_signal',
  'safety_policy_breach'
]);

async function requireAuthenticatedUser(req, res, next) {
  const authorization = String(req.get('authorization') || '');
  const match = authorization.match(/^Bearer (.+)$/i);

  if (!match) {
    return res.status(401).json({ error: 'A Firebase ID token is required.' });
  }

  try {
    const token = await admin.auth().verifyIdToken(match[1], true);
    req.user = token;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'The Firebase ID token is invalid or revoked.' });
  }
}

function requirePhoneOtp(req, res, next) {
  if (!req.user.phone_number) {
    return res.status(403).json({ error: 'A Firebase phone OTP login is required.' });
  }
  return next();
}

function requireVerifiedEmail(req, res, next) {
  if (!req.user.email || req.user.email_verified !== true) {
    return res.status(403).json({ error: 'Firebase email verification is required.' });
  }
  return next();
}

async function requireFleetSession(req, res, next) {
  const sessionToken = String(req.get('x-fleet-session') || '');
  if (!sessionToken) {
    return res.status(401).json({ error: 'A fleet session is required.' });
  }

  const profileSnapshot = await db.collection('profiles').doc(req.user.uid).get();
  if (!profileSnapshot.exists) {
    return res.status(403).json({ error: 'Profile not provisioned.' });
  }

  const profile = profileSnapshot.data();
  const suppliedHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
  const expectedHash = String(profile.activeSessionHash || '');
  const suppliedBuffer = Buffer.from(suppliedHash, 'hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const expiresAt = profile.activeSessionExpiresAt?.toMillis?.() || 0;
  const sessionMatches = suppliedBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(suppliedBuffer, expectedBuffer);

  if (!sessionMatches || expiresAt <= Date.now()) {
    return res.status(401).json({ error: 'Fleet session expired. Complete phone OTP login again.' });
  }
  if (profile.reVerificationRequired === true) {
    return res.status(423).json({
      error: 'Identity re-verification is required before fleet access can continue.',
      reasonCode: profile.reVerificationReasonCode
    });
  }

  req.profile = profile;
  return next();
}

async function createOperationsCode(transaction) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = `SR-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    const codeRef = db.collection('operations_codes').doc(code);
    const codeSnapshot = await transaction.get(codeRef);
    if (!codeSnapshot.exists) return { code, codeRef };
  }

  throw new Error('Unable to allocate a unique operations code.');
}

function utcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function currentWorkedMs(shift, nowMs) {
  const accumulatedMs = Number(shift.accumulatedMs || 0);
  const startedAtMs = shift.activeStartedAt?.toMillis?.();
  return accumulatedMs + (startedAtMs ? Math.max(0, nowMs - startedAtMs) : 0);
}

function requireDriver(req, res, next) {
  if (req.profile.role !== 'driver') {
    return res.status(403).json({ error: 'An active driver profile is required.' });
  }
  if (req.profile.identityVerificationStatus !== 'approved') {
    return res.status(403).json({ error: 'Approved identity verification is required for driver shifts.' });
  }
  return next();
}

async function provisionVerifiedProfile(req, res) {
  try {
    const role = String(req.body?.role || 'customer').trim().toLowerCase();
    if (!SELF_SERVICE_ROLES.has(role)) {
      return res.status(400).json({ error: 'Only rider, driver, or customer may be self-selected.' });
    }

    const profileRef = db.collection('profiles').doc(req.user.uid);
    const result = await db.runTransaction(async (transaction) => {
      const profileSnapshot = await transaction.get(profileRef);
      if (profileSnapshot.exists) {
        const profile = profileSnapshot.data();
        transaction.update(profileRef, {
          email: req.user.email.toLowerCase(),
          emailVerified: true,
          phoneNumber: req.user.phone_number,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return profile;
      }

      const { code, codeRef } = await createOperationsCode(transaction);
      const now = admin.firestore.FieldValue.serverTimestamp();
      const profile = {
        authUid: req.user.uid,
        email: req.user.email.toLowerCase(),
        emailVerified: true,
        phoneNumber: req.user.phone_number,
        phoneOtpVerified: true,
        identityVerificationStatus: 'not_submitted',
        operationsCode: code,
        profileStrength: 'email-verified',
        role,
        status: 'active',
        createdAt: now,
        updatedAt: now
      };

      transaction.create(profileRef, profile);
      transaction.create(codeRef, {
        authUid: req.user.uid,
        purpose: ['operations-reference', 'payment-reference', 'safety-reference'],
        status: 'active',
        createdAt: now
      });
      return profile;
    });

    return res.status(200).json({
      status: 'active',
      userId: req.user.uid,
      operationsCode: result.operationsCode,
      emailVerified: true,
      identityVerificationStatus: result.identityVerificationStatus,
      message: 'Verified profile is active. The operations code is a reference, not an authentication secret.'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to provision verified profile.' });
  }
}

app.get('/health', (req, res) => {
  const region = process.env.FUNCTION_REGION || process.env.GCLOUD_REGION || 'unknown';
  res.status(200).json({
    ok: true,
    runtime: 'node',
    service: 'saferide-backend-functions',
    region
  });
});

app.post(
  '/profiles/start-registration',
  requireAuthenticatedUser,
  requirePhoneOtp,
  requireVerifiedEmail,
  provisionVerifiedProfile
);
app.post(
  '/profiles/verify-email',
  requireAuthenticatedUser,
  requirePhoneOtp,
  requireVerifiedEmail,
  provisionVerifiedProfile
);

app.post('/sessions/open', requireAuthenticatedUser, requirePhoneOtp, requireVerifiedEmail, async (req, res) => {
  const authAgeSeconds = Math.floor(Date.now() / 1000) - Number(req.user.auth_time || 0);
  if (authAgeSeconds < 0 || authAgeSeconds > RECENT_AUTH_SECONDS) {
    return res.status(401).json({ error: 'Complete a new phone OTP login before opening a fleet session.' });
  }

  const profileRef = db.collection('profiles').doc(req.user.uid);
  const profileSnapshot = await profileRef.get();
  if (!profileSnapshot.exists) {
    return res.status(403).json({ error: 'Provision the verified profile before opening a session.' });
  }

  const sessionToken = crypto.randomBytes(32).toString('base64url');
  const sessionHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + SESSION_TTL_MS);
  await profileRef.update({
    activeSessionHash: sessionHash,
    activeSessionExpiresAt: expiresAt,
    activeSessionOpenedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return res.status(201).json({
    fleetSession: sessionToken,
    expiresAt: expiresAt.toDate().toISOString(),
    maximumConcurrentSessions: 1
  });
});

app.get(
  '/profiles/me',
  requireAuthenticatedUser,
  requirePhoneOtp,
  requireVerifiedEmail,
  requireFleetSession,
  async (req, res) => {
  const profile = req.profile;
  return res.status(200).json({
    userId: req.user.uid,
    operationsCode: profile.operationsCode,
    emailVerified: profile.emailVerified,
    identityVerificationStatus: profile.identityVerificationStatus,
    role: profile.role,
    status: profile.status,
    reVerificationRequired: profile.reVerificationRequired === true
  });
});

app.post(
  '/driver/shifts/start',
  requireAuthenticatedUser,
  requirePhoneOtp,
  requireVerifiedEmail,
  requireFleetSession,
  requireDriver,
  async (req, res) => {
    const nowMs = Date.now();
    const day = utcDayKey(new Date(nowMs));
    const shiftRef = db.collection('driver_daily_shifts').doc(`${req.user.uid}_${day}`);
    const auditRef = db.collection('audit_events').doc();

    const shift = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(shiftRef);
      const existing = snapshot.exists ? snapshot.data() : { accumulatedMs: 0 };
      if (existing.activeStartedAt) throw new Error('SHIFT_ALREADY_ACTIVE');
      if (currentWorkedMs(existing, nowMs) >= MAX_DAILY_SHIFT_MS) {
        throw new Error('DAILY_SHIFT_LIMIT_REACHED');
      }

      const updated = {
        authUid: req.user.uid,
        day,
        accumulatedMs: Number(existing.accumulatedMs || 0),
        activeStartedAt: admin.firestore.Timestamp.fromMillis(nowMs),
        dailyLimitMs: MAX_DAILY_SHIFT_MS,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      transaction.set(shiftRef, updated, { merge: true });
      transaction.create(auditRef, {
        actorUid: req.user.uid,
        action: 'driver_shift_started',
        targetId: shiftRef.id,
        occurredAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return updated;
    }).catch((error) => {
      if (error.message === 'SHIFT_ALREADY_ACTIVE') return null;
      if (error.message === 'DAILY_SHIFT_LIMIT_REACHED') return false;
      throw error;
    });

    if (shift === null) return res.status(409).json({ error: 'A driver shift is already active.' });
    if (shift === false) return res.status(403).json({ error: 'The 16-hour daily shift limit has been reached.' });
    return res.status(201).json({ status: 'active', day, dailyLimitHours: 16 });
  }
);

app.post(
  '/driver/shifts/end',
  requireAuthenticatedUser,
  requirePhoneOtp,
  requireVerifiedEmail,
  requireFleetSession,
  requireDriver,
  async (req, res) => {
    const nowMs = Date.now();
    const day = utcDayKey(new Date(nowMs));
    const shiftRef = db.collection('driver_daily_shifts').doc(`${req.user.uid}_${day}`);
    const auditRef = db.collection('audit_events').doc();

    const accumulatedMs = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(shiftRef);
      if (!snapshot.exists || !snapshot.data().activeStartedAt) throw new Error('NO_ACTIVE_SHIFT');
      const shift = snapshot.data();
      const workedMs = Math.min(currentWorkedMs(shift, nowMs), MAX_DAILY_SHIFT_MS);
      transaction.update(shiftRef, {
        accumulatedMs: workedMs,
        activeStartedAt: admin.firestore.FieldValue.delete(),
        lastEndedAt: admin.firestore.Timestamp.fromMillis(nowMs),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      transaction.create(auditRef, {
        actorUid: req.user.uid,
        action: 'driver_shift_ended',
        targetId: shiftRef.id,
        occurredAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return workedMs;
    }).catch((error) => {
      if (error.message === 'NO_ACTIVE_SHIFT') return null;
      throw error;
    });

    if (accumulatedMs === null) return res.status(409).json({ error: 'No active driver shift was found.' });
    return res.status(200).json({
      status: 'ended',
      day,
      workedHours: Number((accumulatedMs / 3600000).toFixed(2)),
      dailyLimitHours: 16
    });
  }
);

app.post('/risk/require-face-reverification', requireAuthenticatedUser, async (req, res) => {
  if (req.user.admin !== true && req.user.riskReviewer !== true) {
    return res.status(403).json({ error: 'Risk reviewer authorization is required.' });
  }

  const userId = String(req.body?.userId || '');
  const reasonCode = String(req.body?.reasonCode || '');
  if (!userId || !FACE_REVERIFICATION_REASONS.has(reasonCode)) {
    return res.status(400).json({ error: 'A userId and approved reasonCode are required.' });
  }

  await db.collection('profiles').doc(userId).update({
    reVerificationRequired: true,
    reVerificationReasonCode: reasonCode,
    reVerificationRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
    reVerificationRequestedBy: req.user.uid,
    activeSessionHash: admin.firestore.FieldValue.delete(),
    activeSessionExpiresAt: admin.firestore.FieldValue.delete(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return res.status(202).json({
    status: 'reverification_required',
    message: 'Fleet access is locked. Use the approved liveness provider; do not upload facial images to this API.'
  });
});

exports.apiUsCentral1 = onRequest({ region: 'us-central1' }, app);
exports.apiEuropeWest1 = onRequest({ region: 'europe-west1' }, app);

// ============================================================================
// FIREBASE MULTI-BRAND DATA ENGINE EXPORTS
// ============================================================================

// Import and export data engine functions
const dataEngineExports = require('./firebase-data-engine.js');
Object.assign(exports, {
  paletteMathColorAnalysis: dataEngineExports.paletteMathColorAnalysis,
  saferideRideMatching: dataEngineExports.saferideRideMatching,
  preleakMonitoring: dataEngineExports.preleakMonitoring,
  qvedicContentDelivery: dataEngineExports.qvedicContentDelivery,
  plumberWorkOrderDispatch: dataEngineExports.plumberWorkOrderDispatch,
  getCrossBrandAnalytics: dataEngineExports.getCrossBrandAnalytics
});

// Import and export ML engine functions
const mlEngineExports = require('./firebase-ml-engine.js');
Object.assign(exports, {
  paletteMathMLTraining: mlEngineExports.paletteMathMLTraining,
  saferideMLTraining: mlEngineExports.saferideMLTraining,
  preleakMLTraining: mlEngineExports.preleakMLTraining,
  mlInference: mlEngineExports.mlInference,
  getMLModelRegistry: mlEngineExports.getMLModelRegistry
});

// Import and export operations coordinator functions
const coordExports = require('./firebase-operations-coordinator.js');
Object.assign(exports, {
  initiateBrandWorkflow: coordExports.initiateBrandWorkflow,
  getOperationsHealth: coordExports.getOperationsHealth,
  storeOperationalMetrics: coordExports.storeOperationalMetrics,
  getDeploymentManifest: coordExports.getDeploymentManifest,
  healthCheck: coordExports.healthCheck
});