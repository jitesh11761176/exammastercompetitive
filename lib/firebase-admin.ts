/**
 * Server-side Firebase configuration for API routes
 * Uses regular env vars (not NEXT_PUBLIC_*) which are available on the server
 */

import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: any = null;
let adminDb: any = null;

export function getAdminApp() {
  if (adminApp) return adminApp;

  try {
    // Check if already initialized
    const apps = getApps();
    if (apps.length > 0) {
      adminApp = apps[0];
      return adminApp;
    }

    // Initialize with service account or project ID
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    if (!projectId) {
      console.error('[Firebase Admin] No project ID found');
      return null;
    }

    console.log('[Firebase Admin] Initializing with project:', projectId);

    // Try to initialize with service account if available
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId,
      });
    } else {
      // Fall back to project ID only (works on Vercel with proper setup)
      adminApp = initializeApp({
        projectId: projectId,
      });
    }

    console.log('[Firebase Admin] App initialized successfully');
    return adminApp;
  } catch (error) {
    console.error('[Firebase Admin] Initialization failed:', error);
    return null;
  }
}

export function getAdminFirestore() {
  if (adminDb) return adminDb;

  const app = getAdminApp();
  if (!app) {
    console.error('[Firebase Admin] Cannot get Firestore - app not initialized');
    return null;
  }

  try {
    adminDb = getFirestore(app);
    console.log('[Firebase Admin] Firestore initialized');
    return adminDb;
  } catch (error) {
    console.error('[Firebase Admin] Firestore initialization failed:', error);
    return null;
  }
}
