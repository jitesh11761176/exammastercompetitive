#!/usr/bin/env node

/**
 * Make User Admin Script
 * 
 * This script creates or updates a user in Firestore with ADMIN role
 * Run: node scripts/make-admin.js <email>
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

async function makeAdmin(email) {
  if (!email) {
    console.error('❌ Error: Email is required');
    console.log('\nUsage: node scripts/make-admin.js <email>');
    console.log('Example: node scripts/make-admin.js user@example.com\n');
    process.exit(1);
  }

  try {
    console.log('\n🚀 Making user admin...\n');
    console.log('Email:', email);

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const firestore = getFirestore(app);

    // Use email as document ID
    const userDocRef = doc(firestore, 'users', email);

    // Check if user exists
    const userSnap = await getDoc(userDocRef);
    
    const userData = {
      email: email,
      role: 'ADMIN',
      updatedAt: new Date().toISOString(),
    };

    if (userSnap.exists()) {
      console.log('📝 User exists, updating role to ADMIN...');
      const existingData = userSnap.data();
      userData.createdAt = existingData.createdAt || new Date().toISOString();
    } else {
      console.log('✨ Creating new user with ADMIN role...');
      userData.createdAt = new Date().toISOString();
    }

    // Set/Update user document
    await setDoc(userDocRef, userData, { merge: true });

    console.log('\n✅ Success! User is now an ADMIN\n');
    console.log('User Details:');
    console.log('- Email:', userData.email);
    console.log('- Role:', userData.role);
    console.log('- Updated:', userData.updatedAt);
    console.log('\n💡 The user can now access admin features at /admin\n');

  } catch (error) {
    console.error('\n❌ Error making user admin:', error.message);
    console.error('\nPlease check:');
    console.error('1. Firebase credentials in .env.local are correct');
    console.error('2. Firestore database is set up in Firebase Console');
    console.error('3. You have internet connection\n');
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];
makeAdmin(email);
