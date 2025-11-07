#!/usr/bin/env node

/**
 * Google OAuth Setup Helper
 * 
 * This script helps you set up Google OAuth for ExamMaster Pro
 * Run: node scripts/setup-google-oauth.js
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('\n🚀 ExamMaster Pro - Google OAuth Setup\n');
  console.log('This script will help you configure Google OAuth authentication.\n');

  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env.local file not found!');
    console.log('Please run this script from the project root directory.\n');
    process.exit(1);
  }

  // Read current .env.local
  let envContent = fs.readFileSync(envPath, 'utf8');

  console.log('📋 Step 1: Google OAuth Credentials\n');
  console.log('Before proceeding, you need to:');
  console.log('1. Go to https://console.cloud.google.com');
  console.log('2. Create a new project or select existing one');
  console.log('3. Enable Google+ API');
  console.log('4. Configure OAuth consent screen');
  console.log('5. Create OAuth 2.0 credentials (Web application)');
  console.log('6. Add authorized redirect URI: http://localhost:3001/api/auth/callback/google\n');
  
  const hasCredentials = await question('Do you have your Google OAuth credentials? (y/n): ');
  
  if (hasCredentials.toLowerCase() !== 'y') {
    console.log('\n📚 Please follow the guide in GOOGLE-OAUTH-SETUP.md');
    console.log('Run this script again once you have your credentials.\n');
    rl.close();
    return;
  }

  console.log('\n');
  const clientId = await question('Enter your Google Client ID: ');
  const clientSecret = await question('Enter your Google Client Secret: ');

  if (!clientId || !clientSecret) {
    console.error('\n❌ Error: Both Client ID and Client Secret are required!\n');
    rl.close();
    process.exit(1);
  }

  // Update environment variables
  console.log('\n📝 Updating .env.local file...\n');

  // Update GOOGLE_CLIENT_ID
  if (envContent.includes('GOOGLE_CLIENT_ID=""')) {
    envContent = envContent.replace('GOOGLE_CLIENT_ID=""', `GOOGLE_CLIENT_ID="${clientId}"`);
  } else if (envContent.includes('GOOGLE_CLIENT_ID=')) {
    envContent = envContent.replace(/GOOGLE_CLIENT_ID="[^"]*"/, `GOOGLE_CLIENT_ID="${clientId}"`);
  }

  // Update GOOGLE_CLIENT_SECRET
  if (envContent.includes('GOOGLE_CLIENT_SECRET=""')) {
    envContent = envContent.replace('GOOGLE_CLIENT_SECRET=""', `GOOGLE_CLIENT_SECRET="${clientSecret}"`);
  } else if (envContent.includes('GOOGLE_CLIENT_SECRET=')) {
    envContent = envContent.replace(/GOOGLE_CLIENT_SECRET="[^"]*"/, `GOOGLE_CLIENT_SECRET="${clientSecret}"`);
  }

  // Check and generate NEXTAUTH_SECRET if needed
  if (envContent.includes('NEXTAUTH_SECRET="generate-a-random-secret-key-here"') || 
      envContent.includes('NEXTAUTH_SECRET=""')) {
    const secret = crypto.randomBytes(32).toString('base64');
    envContent = envContent.replace(/NEXTAUTH_SECRET="[^"]*"/, `NEXTAUTH_SECRET="${secret}"`);
    console.log('✅ Generated new NEXTAUTH_SECRET');
  }

  // Write updated content
  fs.writeFileSync(envPath, envContent);

  console.log('✅ Google OAuth Client ID updated');
  console.log('✅ Google OAuth Client Secret updated');
  console.log('\n🎉 Configuration complete!\n');
  console.log('Next steps:');
  console.log('1. Restart your development server: npm run dev');
  console.log('2. Navigate to http://localhost:3001/login');
  console.log('3. Click "Continue with Google" to test authentication\n');
  console.log('📚 For deployment to Vercel, see: GOOGLE-OAUTH-SETUP.md\n');

  rl.close();
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
