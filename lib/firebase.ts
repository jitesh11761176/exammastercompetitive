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

// Check if we're in a build environment
// During build, NEXT_PUBLIC vars might not be available yet
function isBuildTime() {
  // If we're in a browser, definitely not build time
  if (typeof window !== 'undefined') return false;
  
  // If we have the API key, we're at runtime (even if server-side)
  if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return false;
  
  // No window and no API key = likely build time
  return true;
}

// Validate environment variables only when trying to initialize
function validateEnvVars() {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missing.length > 0) {
    throw new Error(`Missing required Firebase environment variables: ${missing.join(', ')}`);
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
  console.log('[Firebase] Environment check - window:', typeof window !== 'undefined', 'API key exists:', !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  
  // During build time, don't initialize
  if (isBuildTime()) {
    console.log('[Firebase] Skipping initialization - build time detected');
    return null;
  }
  
  try {
    validateEnvVars();
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

// Legacy named exports - these should NOT be used in new code
// They are kept for backwards compatibility but will be null at import time
export let app: any = null;
export let firestore: any = null;
export let analytics: any = null;

// Initialize legacy exports only if not in build time
if (typeof window !== 'undefined') {
  // Client-side: initialize immediately
  app = getFirebaseApp();
  firestore = getFirebaseFirestore();
  analytics = getFirebaseAnalytics();
}