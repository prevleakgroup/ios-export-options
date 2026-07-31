/**
 * firebase-init.js — modular Firebase client initialisation
 *
 * Usage (any page that needs Firebase):
 *   <script type="module">
 *     import { app, auth, loadFirestore } from './firebase-init.js';
 *
 *     // Lazy-load Firestore with offline persistence:
 *     const db = await loadFirestore();
 *   </script>
 *
 * Note: login.html uses the compat SDK because FirebaseUI requires it.
 * All other pages should import from this module.
 */

import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js';

// ---------------------------------------------------------------------------
// Firebase app configuration
// Replace placeholder values with your project's config from
// Firebase Console → Project Settings → Your apps → SDK setup.
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: 'REPLACE_API_KEY',
  authDomain: 'saferide-peld8.firebaseapp.com',
  projectId: 'saferide-peld8',
  storageBucket: 'saferide-peld8.appspot.com',
  messagingSenderId: 'REPLACE_SENDER_ID',
  appId: 'REPLACE_APP_ID',
  databaseURL: 'https://saferide-peld8-default-rtdb.firebaseio.com'
};

// Guard against double-initialisation (e.g. hot-module reload, multiple imports).
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ---------------------------------------------------------------------------
// Auth — observe sign-in state across every page that imports this module.
// ---------------------------------------------------------------------------
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in.
    // Dispatch a custom event so individual pages can react without coupling.
    window.dispatchEvent(new CustomEvent('firebase:authsignedin', { detail: { user } }));
  } else {
    // User is signed out.
    window.dispatchEvent(new CustomEvent('firebase:authsignedout'));
  }
});

// ---------------------------------------------------------------------------
// Firestore — lazy-loaded with offline persistence enabled.
//
// Replaces the compat pattern:
//   firebase.firestore().enablePersistence().then(() => { ... });
//
// Call loadFirestore() and await the result to get a ready-to-use db handle.
// ---------------------------------------------------------------------------
let _firestorePromise = null;

async function loadFirestore() {
  if (_firestorePromise) return _firestorePromise;

  _firestorePromise = import('https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js')
    .then(({ getFirestore, enableIndexedDbPersistence }) => {
      const db = getFirestore(app);
      return enableIndexedDbPersistence(db)
        .catch((err) => {
          if (err.code === 'failed-precondition') {
            // Multiple tabs open — persistence is only enabled in one tab at a time.
            console.warn('[firebase-init] Firestore persistence unavailable: multiple tabs open.');
          } else if (err.code === 'unimplemented') {
            // The browser does not support IndexedDB persistence.
            console.warn('[firebase-init] Firestore persistence is not supported in this browser.');
          }
        })
        .then(() => db);
    });

  return _firestorePromise;
}

export { app, auth, loadFirestore };
