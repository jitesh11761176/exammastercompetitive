#!/usr/bin/env node

/**
 * Script to make a user an admin in Firebase Firestore
 * Usage: npm run make-admin <user-email>
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

// Firebase configuration (same as in lib/firebase.ts)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    console.error('Please make sure your .env.local file contains all Firebase configuration variables.');
    process.exit(1);
  }
}

async function makeUserAdmin(userEmail: string) {
  try {
    console.log('🚀 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const firestore = getFirestore(app);

    console.log(`👤 Making user admin: ${userEmail}`);

    // In NextAuth with Google provider, user ID is typically the Google user ID
    // We'll need to find the user by email or create a mapping
    // For now, let's assume we need to create a user document with the email as ID

    const userId = userEmail; // Using email as user ID for simplicity

    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log('📝 Creating new user document...');
      await setDoc(userRef, {
        email: userEmail,
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
        name: userEmail.split('@')[0], // Default name from email
        isActive: true,
      });
      console.log('✅ User created and made admin successfully!');
    } else {
      console.log('📝 Updating existing user to admin...');
      await setDoc(userRef, {
        role: 'ADMIN',
        updatedAt: new Date(),
      }, { merge: true });
      console.log('✅ User updated to admin successfully!');
    }

    console.log(`🎉 User ${userEmail} is now an ADMIN!`);
    console.log('You can now access admin routes at /admin');

  } catch (error) {
    console.error('❌ Error making user admin:', error);
    process.exit(1);
  }
}

// Get user email from command line arguments
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('❌ Usage: npm run make-admin <user-email>');
  console.error('Example: npm run make-admin admin@example.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(userEmail)) {
  console.error('❌ Invalid email format');
  process.exit(1);
}

makeUserAdmin(userEmail);