/**
 * firebase-sw.js — Firebase Cloud Messaging service worker (modular SDK)
 *
 * Built with:
 *   npx esbuild ./src/firebase-sw.js --bundle --minify \
 *     --main-fields=webworker,browser,module,main,default \
 *     --outfile=download-site/apps/firebase-sw.js
 *
 * Using the modular SDK avoids the compat importScripts() pattern and
 * eliminates the "Component data-connect has not been registered yet" error
 * caused by mixed firebase@10 / firebase@11 versions in the dependency tree.
 * The root package.json "overrides" field pins firebase to ^11.2.0 so every
 * transitive dependency resolves to the same major version.
 */

import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// ---------------------------------------------------------------------------
// Firebase app configuration
// Replace placeholder values with your project's config object from
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

const app = initializeApp(firebaseConfig);

// ---------------------------------------------------------------------------
// Firebase Messaging — background message handler
// Handles messages when the app is in the background or closed.
// ---------------------------------------------------------------------------
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  const title = payload.notification?.title ?? 'Prevleakgroup™';
  const options = {
    body: payload.notification?.body ?? '',
    icon: payload.notification?.icon ?? '/assets/prevleak-logo.svg',
    badge: '/assets/prevleak-logo.svg',
    data: payload.data ?? {}
  };
  self.registration.showNotification(title, options);
});

// ---------------------------------------------------------------------------
// Service worker lifecycle
// ---------------------------------------------------------------------------
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Handle notification clicks — focus an existing tab or open a new one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});
