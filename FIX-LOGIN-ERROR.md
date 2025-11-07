# 🔧 Fix "Login error: Configuration"

## Quick Fix (5 minutes)

You're seeing this error because Google OAuth credentials are not configured. Here's how to fix it:

### Option 1: Automated Setup (Recommended)

Run the setup script:

```bash
node scripts/setup-google-oauth.js
```

This will guide you through setting up your credentials.

### Option 2: Manual Setup

#### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project: "ExamMaster Pro"
3. Go to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Configure OAuth consent screen (if prompted):
   - User type: External
   - App name: ExamMaster Pro
   - Add your email as test user
6. Application type: **Web application**
7. Add Authorized redirect URI:
   ```
   http://localhost:3001/api/auth/callback/google
   ```
8. Click **Create**
9. **Copy** the Client ID and Client Secret

#### Step 2: Update .env.local

Open `.env.local` and update:

```bash
# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# NextAuth Secret (already generated for you)
NEXTAUTH_SECRET="6lOvdDBtHCqbBpPpe4n3Q+H41InTe+8z9rlFn/eAuUk="
```

#### Step 3: Restart Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

#### Step 4: Test Login

1. Open http://localhost:3001/login
2. Click "Continue with Google"
3. Sign in with your Google account
4. You should be redirected to the dashboard

## Troubleshooting

### Still seeing "Configuration" error?

**Check 1: Environment Variables Loaded**
```bash
# Restart your dev server
npm run dev
```

**Check 2: Correct Redirect URI**
Make sure in Google Console the redirect URI is exactly:
```
http://localhost:3001/api/auth/callback/google
```

**Check 3: Verify .env.local**
```bash
# Should see your actual values, not empty strings
cat .env.local | grep GOOGLE
```

### "redirect_uri_mismatch" error?

The redirect URI in Google Console doesn't match. Add:
```
http://localhost:3001/api/auth/callback/google
```

### "Access blocked" error?

1. Go to OAuth consent screen in Google Console
2. Add your email as a test user
3. Make sure status is not "In production" (should be "Testing")

## For Production (Vercel)

### Step 1: Update Google Console

Add production redirect URI:
```
https://your-app.vercel.app/api/auth/callback/google
```

### Step 2: Set Vercel Environment Variables

In Vercel dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `GOOGLE_CLIENT_ID` | Your client ID |
| `GOOGLE_CLIENT_SECRET` | Your client secret |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | From Firebase Console |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | From Firebase Console |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | From Firebase Console |

### Step 3: Redeploy

```bash
git add .
git commit -m "Configure Google OAuth"
git push origin main
```

## Need More Help?

- See detailed guide: [GOOGLE-OAUTH-SETUP.md](./GOOGLE-OAUTH-SETUP.md)
- Check NextAuth docs: https://next-auth.js.org/providers/google
- Check Google OAuth docs: https://developers.google.com/identity/protocols/oauth2

## Current Status

✅ NEXTAUTH_SECRET: Configured  
❌ GOOGLE_CLIENT_ID: **Not configured** (empty)  
❌ GOOGLE_CLIENT_SECRET: **Not configured** (empty)  

**Action Required:** Follow Option 1 or Option 2 above to configure Google OAuth.
