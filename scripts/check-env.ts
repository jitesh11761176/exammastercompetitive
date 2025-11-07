#!/usr/bin/env node

/**
 * Script to check Firebase environment variables
 * Run this to verify all required env vars are set
 */

const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

console.log('🔍 Checking Firebase Environment Variables...\n');

let allSet = true;

for (const envVar of requiredVars) {
  const value = process.env[envVar];
  const isSet = !!value;
  const status = isSet ? '✅' : '❌';

  console.log(`${status} ${envVar}: ${isSet ? 'Set' : 'NOT SET'}`);

  if (!isSet) {
    allSet = false;
  }
}

console.log('\n' + '='.repeat(50));

if (allSet) {
  console.log('🎉 All required environment variables are set!');
  console.log('Your Vercel deployment should work correctly.');
} else {
  console.log('❌ Some environment variables are missing!');
  console.log('Please set them in your Vercel dashboard:');
  console.log('https://vercel.com/dashboard/integrations/env-vars');
  console.log('\nRequired variables:');
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      console.log(`- ${envVar}`);
    }
  });
}

console.log('\n📋 For Firebase variables, check your Firebase Console:');
console.log('https://console.firebase.google.com/project/YOUR_PROJECT/settings/general');
console.log('Go to "Your apps" section and copy the config values.');