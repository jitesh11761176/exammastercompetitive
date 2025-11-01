# 🔧 Sentry, Resend & VAPID Setup Guide

## Overview

This guide will help you configure:
1. **Sentry** - Error monitoring and performance tracking
2. **Resend** - Transactional email service
3. **VAPID Keys** - Web push notifications ✅ (Already Generated!)

---

## ✅ VAPID Keys - COMPLETED!

Your VAPID keys have been generated and added to `.env`:

```env
VAPID_PUBLIC_KEY="MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEv-IisjQarIbfDJym-DHT4tl5f-xYf4tYC7PU2NEskc1h2oDgBl7WZR6Gu1oR5jh9Le0bPRiJ3vvpA5aVOaR19A"
VAPID_PRIVATE_KEY="MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgrVW4l7PMdvIyOWW1BsUs6s394oGwA9lJVFDpBScWzt-hRANCAAS_4iKyNBqsht8MnKb4MdPi2Xl_7Fh_i1gLs9TY0SyRzWHagOAGXtZlHoa7WhHmOH0t7Rs9GIne--kDlpU5pHX0"
VAPID_SUBJECT="mailto:jiteshshahpgtcs2@gmail.com"
```

⚠️ **Security Note**: Never share your private key or commit it to version control!

---

## 1️⃣ Sentry Setup (Error Monitoring)

### What is Sentry?
Sentry helps you monitor errors, track performance, and debug issues in production.

### Step 1: Create Sentry Account
1. Open browser: https://sentry.io (already opened for you!)
2. Click **"Get Started"** or **"Sign Up"**
3. Choose **"Sign up with GitHub"** (recommended) or use email
4. Verify your email if required

### Step 2: Create New Project
1. After login, click **"Create Project"**
2. Select **"Next.js"** as platform
3. Configure:
   - **Alert Frequency**: Default (recommended)
   - **Project Name**: `exammaster-pro` (or your choice)
   - **Team**: Default
4. Click **"Create Project"**

### Step 3: Get DSN and Configuration
After project creation, you'll see setup instructions. Copy these values:

```javascript
// You'll see something like:
Sentry.init({
  dsn: "https://xxxxx@xxxxx.ingest.sentry.io/xxxxx",  // ← Copy this
  ...
});
```

### Step 4: Get Additional Details
1. Go to **Settings** → **Projects** → **Your Project**
2. Find:
   - **Organization Slug** (Settings → General)
   - **Project Slug** (Settings → General)
3. Create Auth Token:
   - Go to **Settings** → **Auth Tokens**
   - Click **"Create New Token"**
   - Name: `CI/CD Token`
   - Scopes: Select `project:releases`, `org:read`
   - Click **"Create Token"** and copy it

### Step 5: Update .env
Replace the placeholders in your `.env` file:

```env
NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
SENTRY_AUTH_TOKEN="sntrys_xxxxx"  # From step 4
SENTRY_ORG="your-org-slug"         # From step 4
SENTRY_PROJECT="exammaster-pro"    # Your project name
SENTRY_ENVIRONMENT="development"   # Keep as is
SENTRY_TRACES_SAMPLE_RATE="0.1"    # Keep as is (10% of transactions)
SENTRY_SESSION_REPLAY_SAMPLE_RATE="0.1"  # Keep as is
```

### Free Tier Limits
- **5,000 errors/month**
- **10,000 performance units/month**
- Perfect for development and small production apps!

---

## 2️⃣ Resend Setup (Transactional Emails)

### What is Resend?
Resend is a modern email API for sending transactional emails (password resets, notifications, test results, etc.)

### Step 1: Create Resend Account
1. Open browser: https://resend.com (already opened for you!)
2. Click **"Sign Up"** or **"Get Started"**
3. Sign up with email or GitHub
4. Verify your email

### Step 2: Verify Domain (Production) or Use Test Domain

**Option A: Use Test Domain (Quick Start)**
1. After login, you can use `resend.dev` domain for testing
2. Emails sent from: `onboarding@resend.dev`
3. Perfect for development!

**Option B: Verify Your Domain (Production)**
1. Go to **Domains** in Resend dashboard
2. Click **"Add Domain"**
3. Enter your domain (e.g., `exammaster.com`)
4. Add DNS records (SPF, DKIM, DMARC) to your domain provider
5. Wait for verification (usually 5-10 minutes)

### Step 3: Create API Key
1. Go to **API Keys** in Resend dashboard
2. Click **"Create API Key"**
3. Configure:
   - **Name**: `Development Key` or `Production Key`
   - **Permission**: `Full Access` or `Sending Access`
   - **Domain**: Select your domain
4. Click **"Create"**
5. **Copy the API key** (you won't see it again!)

### Step 4: Update .env
```env
RESEND_API_KEY="re_xxxxx"  # From step 3
RESEND_FROM_EMAIL="noreply@resend.dev"  # Or your verified domain
```

If using your domain:
```env
RESEND_FROM_EMAIL="noreply@exammaster.com"
```

### Free Tier Limits
- **100 emails/day**
- **3,000 emails/month**
- Perfect for development!

### Test Email Send
Create a test file `scripts/test-email.ts`:

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

async function testEmail() {
  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: 'your-email@example.com',  // Your email
      subject: 'Test Email from ExamMaster',
      html: '<h1>Hello!</h1><p>Your email configuration is working! 🎉</p>'
    })
    
    console.log('✅ Email sent successfully!')
    console.log('Email ID:', data.id)
  } catch (error) {
    console.error('❌ Error sending email:', error)
  }
}

testEmail()
```

Run: `npx tsx scripts/test-email.ts`

---

## 3️⃣ Environment Variables Summary

After completing all setups, your `.env` should look like:

```env
# Sentry (Error Monitoring)
NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
SENTRY_AUTH_TOKEN="sntrys_xxxxx"
SENTRY_ORG="your-org"
SENTRY_PROJECT="exammaster-pro"
SENTRY_ENVIRONMENT="development"
SENTRY_TRACES_SAMPLE_RATE="0.1"
SENTRY_SESSION_REPLAY_SAMPLE_RATE="0.1"

# Resend (Emails)
RESEND_API_KEY="re_xxxxx"
RESEND_FROM_EMAIL="noreply@resend.dev"  # or your domain

# VAPID (Push Notifications) - Already configured! ✅
VAPID_PUBLIC_KEY="MFkwEwYH..."
VAPID_PRIVATE_KEY="MIGHAgEA..."
VAPID_SUBJECT="mailto:your-email@gmail.com"
```

---

## 🧪 Testing Your Setup

### Test Sentry
1. Create `app/test-sentry/page.tsx`:
```typescript
'use client'

export default function TestSentry() {
  return (
    <button onClick={() => {
      throw new Error('Test Sentry Error!')
    }}>
      Throw Test Error
    </button>
  )
}
```

2. Visit `/test-sentry` and click the button
3. Check Sentry dashboard for the error

### Test Resend
Run the test email script:
```bash
npx tsx scripts/test-email.ts
```

Check your inbox for the test email.

### Test VAPID (Push Notifications)
Your VAPID keys are ready! You can implement push notifications using the Web Push API.

---

## 📊 Infrastructure Status

| Service | Status | Free Tier | Usage |
|---------|--------|-----------|-------|
| Redis (Upstash) | ✅ Configured | 10K commands/day | Background jobs, caching |
| Sentry | ⏳ Pending | 5K errors/month | Error monitoring |
| Resend | ⏳ Pending | 3K emails/month | Transactional emails |
| VAPID Keys | ✅ Generated | N/A | Push notifications |

---

## 🎯 What Each Service Does

### Sentry
- **Error Tracking**: Catch and log production errors
- **Performance Monitoring**: Track API response times
- **Session Replay**: See what users did before errors
- **Alerts**: Get notified of critical issues

### Resend
- **Welcome Emails**: Send when users sign up
- **Password Reset**: Send reset links
- **Test Results**: Email test scores and reports
- **Notifications**: Weekly summaries, reminders

### VAPID/Push Notifications
- **Study Reminders**: Notify users to study
- **New Tests**: Alert about new test availability
- **Results Ready**: Notify when scoring is complete
- **Achievements**: Celebrate milestones

---

## 🚀 Next Steps

1. **Complete Sentry Setup** (5 minutes)
   - Create account at https://sentry.io
   - Create Next.js project
   - Copy DSN and tokens
   - Update `.env`

2. **Complete Resend Setup** (5 minutes)
   - Create account at https://resend.com
   - Create API key
   - Update `.env`

3. **Test Everything** (2 minutes)
   - Test Sentry error tracking
   - Test Resend email sending
   - VAPID keys are ready to use!

4. **Start Development**
   ```bash
   npm run dev
   ```

---

## 💡 Pro Tips

1. **Development**: Use free tiers for all services
2. **Production**: Monitor usage in each dashboard
3. **Security**: Never commit `.env` to git
4. **Backup**: Keep environment variables in a secure password manager
5. **Testing**: Use test domains/projects before production

---

## 📚 Additional Resources

- **Sentry Docs**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Resend Docs**: https://resend.com/docs
- **Web Push API**: https://developer.mozilla.org/en-US/docs/Web/API/Push_API

---

## ❓ Troubleshooting

### Sentry not capturing errors?
- Check `NEXT_PUBLIC_SENTRY_DSN` is set correctly
- Verify DSN includes the protocol (`https://`)
- Check browser console for Sentry initialization

### Emails not sending?
- Verify `RESEND_API_KEY` is correct
- Check `RESEND_FROM_EMAIL` matches verified domain
- Look at Resend dashboard logs

### Push notifications not working?
- Ensure VAPID keys are added to `.env`
- Check browser supports push notifications
- Verify user granted notification permission

---

**Your infrastructure is almost complete! Just configure Sentry and Resend, and you're ready to build! 🎊**
