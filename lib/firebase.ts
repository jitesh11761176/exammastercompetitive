import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Validate required Firebase environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

// Check if we're in a build environment and skip validation if env vars aren't available
const isBuildTime = typeof window === 'undefined' && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!isBuildTime) {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Lazy initialization - only initialize when actually accessed at runtime
let _app: any = null;
let _firestore: any = null;
let _analytics: any = null;

function ensureInitialized() {
  if (_app) return _app;
  
  console.log('[Firebase] Initializing Firebase app...');
  
  // During build time, don't initialize
  if (isBuildTime) {
    console.log('[Firebase] Skipping initialization - build time');
    return null;
  }
  
  try {
    _app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    console.log('[Firebase] App initialized successfully');
    return _app;
  } catch (error) {
    console.error('[Firebase] Failed to initialize:', error);
    return null;
  }
}

// Getter for app
export const getFirebaseApp = () => {
  if (!_app) {
    ensureInitialized();
  }
  return _app;
};

// Getter for firestore
export const getFirebaseFirestore = () => {
  if (!_firestore) {
    const app = getFirebaseApp();
    if (app) {
      _firestore = getFirestore(app);
      console.log('[Firebase] Firestore initialized');
    }
  }
  return _firestore;
};

// Getter for analytics
export const getFirebaseAnalytics = () => {
  if (!_analytics && typeof window !== 'undefined') {
    const app = getFirebaseApp();
    if (app) {
      _analytics = getAnalytics(app);
      console.log('[Firebase] Analytics initialized');
    }
  }
  return _analytics;
};

// Legacy exports for backwards compatibility
export const app = getFirebaseApp();
export const firestore = getFirebaseFirestore();
export const analytics = typeof window !== 'undefined' ? getFirebaseAnalytics() : null;