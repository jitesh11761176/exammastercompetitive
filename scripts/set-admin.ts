/**
 * Emergency script to set admin role directly in Firestore
 * Run this locally: npx tsx scripts/set-admin.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const setAdmin = async () => {
  console.log('Setting admin role...');
  
  try {
    // Force Firebase initialization
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    
    console.log('Initializing Firebase...');
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getFirestore(app);
    
    const email = 'jiteshshahpgtcs2@gmail.com';
    
    console.log('Checking existing user document...');
    const userRef = doc(db, 'users', email);
    const existingDoc = await getDoc(userRef);
    
    if (existingDoc.exists()) {
      console.log('Existing document:', existingDoc.data());
    } else {
      console.log('No existing document found');
    }
    
    console.log('\nUpdating role to ADMIN...');
    await setDoc(userRef, {
      email: email,
      role: 'ADMIN',
      name: 'jiteshshah pgtcs2',
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('\nVerifying update...');
    const updatedDoc = await getDoc(userRef);
    const data = updatedDoc.data();
    console.log('Updated document:', data);
    
    if (data?.role === 'ADMIN') {
      console.log('\n✅ SUCCESS! Role is now ADMIN');
      console.log('Now log out and log back in on your website');
    } else {
      console.log('\n❌ Failed to update role');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
};

setAdmin();
