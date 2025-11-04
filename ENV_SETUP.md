# Environment Setup Guide

## 1. Create `.env.local` file in project root

```env
# ============================================================================
# DATABASE
# ============================================================================
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# ============================================================================
# NEXTAUTH (Already configured)
# ============================================================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth (Already configured)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# ============================================================================
# RAZORPAY PAYMENT GATEWAY
# ============================================================================
# Get from: https://dashboard.razorpay.com/app/keys

# Server-side (Keep secret!)
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="your_razorpay_secret"

# Client-side (Exposed to browser)
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxx"

# ============================================================================
# CLOUDFLARE STREAM (Video Hosting)
# ============================================================================
# Get from: https://dash.cloudflare.com/

CLOUDFLARE_ACCOUNT_ID="your_cloudflare_account_id"
CLOUDFLARE_STREAM_API_TOKEN="your_cloudflare_stream_token"

# Your Cloudflare customer subdomain
# Find in: Cloudflare Dashboard > Stream > Videos > Any video URL
# Example: If URL is "https://customer-abc123.cloudflarestream.com/..."
# Then your subdomain is "abc123"
NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN="your_subdomain"

# ============================================================================
# REDIS (Already configured - Optional for video caching)
# ============================================================================
REDIS_URL="redis://..."

# ============================================================================
# GOOGLE GEMINI AI (Already configured)
# ============================================================================
GOOGLE_GEMINI_API_KEY="your-gemini-api-key"

# ============================================================================
# EMAIL (Already configured - Optional)
# ============================================================================
EMAIL_SERVER="smtp://user:password@host:port"
EMAIL_FROM="noreply@example.com"
```

---

## 2. Get Razorpay Credentials

### Step 1: Sign Up
1. Go to https://razorpay.com/
2. Click "Sign Up" (or "Log In" if you have an account)
3. Complete registration

### Step 2: Get API Keys
1. Go to Dashboard: https://dashboard.razorpay.com/
2. Navigate to **Settings** (left sidebar)
3. Click on **API Keys**
4. Select **Test Mode** (toggle at top)
5. Click **Generate Test Key**
6. Copy both:
   - **Key ID** → `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - **Key Secret** → `RAZORPAY_KEY_SECRET` (keep this private!)

### Step 3: Test Mode vs Live Mode
- **Test Mode**: Use for development
  - Test cards won't charge real money
  - Test card: 4111 1111 1111 1111
  
- **Live Mode**: Use for production
  - Real payments
  - Requires business verification
  - Switch when ready to go live

### Test Card Details
```
Card Number: 4111 1111 1111 1111
CVV: Any 3 digits (e.g., 123)
Expiry: Any future date
```

---

## 3. Get Cloudflare Stream Credentials

### Step 1: Sign Up
1. Go to https://dash.cloudflare.com/sign-up
2. Create account (or log in)

### Step 2: Enable Stream
1. From dashboard, select your account
2. Go to **Stream** in left sidebar
3. Click **Get Started** (if first time)

### Step 3: Get Account ID
1. In Stream dashboard, look at URL
2. URL format: `https://dash.cloudflare.com/{ACCOUNT_ID}/stream`
3. Copy the `{ACCOUNT_ID}` → `CLOUDFLARE_ACCOUNT_ID`

### Step 4: Create API Token
1. Click on your profile (top right)
2. Go to **My Profile** > **API Tokens**
3. Click **Create Token**
4. Select template: **Stream (Edit)**
   - Or create custom token with permissions:
     - Stream: Edit
5. Click **Continue to summary** → **Create Token**
6. Copy the token → `CLOUDFLARE_STREAM_API_TOKEN`
   - ⚠️ Save it now! You won't see it again

### Step 5: Get Customer Subdomain
1. Upload any test video to Stream
2. Click on the video
3. Look at the embed code or video URL
4. Format: `https://customer-{SUBDOMAIN}.cloudflarestream.com/...`
5. Extract `{SUBDOMAIN}` → `NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN`

Example:
```
URL: https://customer-abc123def456.cloudflarestream.com/xyz.mp4
Subdomain: abc123def456
```

---

## 4. Run Database Migration

After setting up `.env.local`:

```powershell
# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Optional: Seed sample data
npx prisma db seed
```

---

## 5. Test the Setup

### Start Development Server
```powershell
npm run dev
```

### Test Payment Flow
1. Go to http://localhost:3000/courses
2. Click "Enroll Now" on a premium course
3. Razorpay modal should open
4. Use test card: 4111 1111 1111 1111
5. Complete payment
6. Should redirect to course page
7. Check enrollment in database

### Test Video Player
1. Create a course with lectures (via Prisma Studio or seed)
2. Upload a video to Cloudflare Stream
3. Add video ID to lecture
4. Visit course page
5. Play video
6. Check progress saves in database

---

## 6. Verify Environment Variables

Run this script to verify your setup:

```powershell
node -e "
const required = [
  'DATABASE_URL',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'NEXT_PUBLIC_RAZORPAY_KEY_ID',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_STREAM_API_TOKEN',
  'NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN'
];

const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

required.forEach(key => {
  console.log(key + ':', process.env[key] ? '✓ SET' : '✗ MISSING');
});
"
```

---

## 7. Troubleshooting

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Check if database is accessible
- Test connection: `npx prisma db push`

### Razorpay Modal Not Opening
- Check `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set
- Verify it's the **test** key (starts with `rzp_test_`)
- Open browser console for errors

### Payment Verification Fails
- Check `RAZORPAY_KEY_SECRET` is correct
- Verify signature verification logic
- Check server logs for errors

### Video Not Playing
- Verify `NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN` is correct
- Check video ID exists in Cloudflare Stream
- Open browser console for CORS errors
- Verify Cloudflare Stream is enabled

### Video Progress Not Saving
- Check user is authenticated
- Verify lecture ID exists in database
- Check API route logs: `/api/lectures/[id]/progress`
- Check browser network tab for failed requests

---

## 8. Security Checklist

- [ ] Never commit `.env.local` to git (already in `.gitignore`)
- [ ] Use environment variables for all secrets
- [ ] Use test keys in development
- [ ] Switch to live keys only in production
- [ ] Rotate API tokens if exposed
- [ ] Enable Razorpay webhooks in production
- [ ] Set up CORS for Cloudflare Stream
- [ ] Enable rate limiting on payment APIs

---

## 9. Production Deployment (Vercel)

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard:
   - Settings > Environment Variables
   - Add all variables from `.env.local`
   - Use **Production** environment
4. Deploy
5. Test payment flow on production URL
6. Switch Razorpay to live mode when ready

---

## 10. Quick Start Summary

```powershell
# 1. Copy .env.example to .env.local (or create new file)
cp .env.example .env.local  # or manually create

# 2. Fill in all required environment variables
# (See sections above for how to get credentials)

# 3. Install dependencies (if not done)
npm install

# 4. Generate Prisma client
npx prisma generate

# 5. Push database schema
npx prisma db push

# 6. Start development server
npm run dev

# 7. Test on http://localhost:3000
```

---

## Need Help?

- **Razorpay Docs**: https://razorpay.com/docs/
- **Cloudflare Stream Docs**: https://developers.cloudflare.com/stream/
- **Prisma Docs**: https://www.prisma.io/docs/
- **Next.js Docs**: https://nextjs.org/docs/

Check project documentation:
- `PAYMENT-VIDEO-SYSTEM-COMPLETE.md` - Implementation details
- `PROJECT_SUMMARY.md` - Overall project structure
- `README.md` - General information
