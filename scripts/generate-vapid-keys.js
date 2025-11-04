const crypto = require('crypto');

function generateVapidKeys() {
  console.log('\n🔐 Generating VAPID Keys for Push Notifications...\n');

  const keyPair = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' }
  });

  const publicKey = Buffer.from(keyPair.publicKey).toString('base64url');
  const privateKey = Buffer.from(keyPair.privateKey).toString('base64url');

  console.log('✅ VAPID Keys Generated Successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Add these to your .env file:\n');
  console.log('VAPID_PUBLIC_KEY="' + publicKey + '"');
  console.log('VAPID_PRIVATE_KEY="' + privateKey + '"');
  console.log('VAPID_SUBJECT="mailto:admin@exammaster.com"\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('⚠️  Keep the private key SECRET - never commit to git!');
  console.log('💡 Change VAPID_SUBJECT to your actual admin email\n');
}

generateVapidKeys();
