import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDoc,
  setLogLevel,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';

// Suppress benign verbose offline retry warnings in the console
try {
  setLogLevel('error');
} catch {
  // Ignore if unsupported in environment
}

export const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

// Initialize Firebase App singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const customDbId =
  firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== '(default)'
    ? firebaseConfigData.firestoreDatabaseId
    : undefined;

// Initialize Firestore with experimentalForceLongPolling and ignoreUndefinedProperties
// This avoids WebSocket failures, proxy timeouts, and ensures instant connectivity
export const db = (() => {
  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
        ignoreUndefinedProperties: true,
      },
      customDbId
    );
  } catch {
    return customDbId ? getFirestore(app, customDbId) : getFirestore(app);
  }
})();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Graceful Connection test helper with resilient timeout protection
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const timeoutPromise = new Promise<boolean>((resolve) =>
      setTimeout(() => resolve(false), 2500)
    );
    const fetchPromise = getDoc(doc(db, '_connection_test', 'ping'))
      .then(() => true)
      .catch(() => false);
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch {
    return false;
  }
}

