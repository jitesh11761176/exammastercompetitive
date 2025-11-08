import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Check if we're in a build environment
// During build, NEXT_PUBLIC vars might not be available yet
function isBuildTime() {
  // If we're in a browser, definitely not build time
  if (typeof window !== 'undefined') return false;
  
  // Check for any Firebase config
  const hasClientConfig = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const hasServerConfig = !!process.env.FIREBASE_API_KEY;
  
  // If we have ANY Firebase config, we're at runtime
  if (hasClientConfig || hasServerConfig) return false;
  
  // No window and no config = likely build time
  return true;
}

// Get Firebase config - try server env vars first (for API routes), then client vars
function getFirebaseConfig() {
  return {
    apiKey: process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}





// Lazy initialization - only initialize when actually accessed at runtime
let _app: any = null;
let _firestore: any = null;
let _analytics: any = null;

function ensureInitialized() {
  if (_app) return _app;
  
  console.log('[Firebase] Initializing Firebase app...');
  console.log('[Firebase] Environment check:', {
    isWindow: typeof window !== 'undefined',
    hasClientApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    hasServerApiKey: !!process.env.FIREBASE_API_KEY,
    hasClientProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    hasServerProjectId: !!process.env.FIREBASE_PROJECT_ID,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  });
  
  // During build time, don't initialize
  if (isBuildTime()) {
    console.log('[Firebase] Skipping initialization - build time detected');
    return null;
  }
  
  try {
    // Get config with fallback to server vars
    const config = getFirebaseConfig();
    
    console.log('[Firebase] Using config for project:', config.projectId);
    console.log('[Firebase] Config check:', {
      hasApiKey: !!config.apiKey,
      hasProjectId: !!config.projectId,
      hasAuthDomain: !!config.authDomain,
      hasAppId: !!config.appId,
    });
    
    // Check if we have minimum required config
    if (!config.apiKey || !config.projectId) {
      const missing = [];
      if (!config.apiKey) missing.push('apiKey (NEXT_PUBLIC_FIREBASE_API_KEY)');
      if (!config.projectId) missing.push('projectId (NEXT_PUBLIC_FIREBASE_PROJECT_ID)');
      throw new Error(`Missing required Firebase configuration: ${missing.join(', ')}`);
    }
    
    _app = !getApps().length ? initializeApp(config) : getApp();
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
    if (!app) {
      throw new Error('[Firebase] App not initialized. Cannot get Firestore instance.');
    }
    _firestore = getFirestore(app);
    console.log('[Firebase] Firestore initialized');
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