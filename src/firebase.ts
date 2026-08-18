/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Real Firebase connection — no mock/dummy config.
// All values come from environment variables set in .env (see .env.example).
// Get these from: Firebase Console → Project Settings → General → Your apps → SDK setup and configuration

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.databaseURL) {
  // Fails loudly instead of silently falling back to fake/demo data.
  console.error(
    'Firebase is not configured. Copy .env.example to .env and fill in your real Firebase project credentials.'
  );
}

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
