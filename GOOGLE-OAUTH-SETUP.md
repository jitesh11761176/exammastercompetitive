# Google OAuth Setup Guide

## Prerequisites
- Google Cloud Console account
- ExamMaster Pro project

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click on project dropdown → "New Project"
3. Name: "ExamMaster Pro OAuth"
4. Click "Create"

## Step 2: Enable Google+ API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type
3. Click "Create"

### Fill in the required information:

**App information:**
- App name: `ExamMaster Pro`
- User support email: `your-email@example.com`
- Developer contact email: `your-email@example.com`

**App domain (Optional for testing):**
- Application home page: `http://localhost:3001`
- Application privacy policy link: `http://localhost:3001/privacy`
- Application terms of service link: `http://localhost:3001/terms`

4. Click "Save and Continue"

**Scopes:**
- Add the following scopes:
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
  - `openid`

5. Click "Save and Continue"

**Test users (for development):**
- Add your email addresses that will test the app
- Click "Add Users" and enter emails

6. Click "Save and Continue"
7. Review and click "Back to Dashboard"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "ExamMaster Pro Web Client"

### Authorized JavaScript origins:
```
http://localhost:3001
http://localhost:3000
https://your-production-domain.com
```

### Authorized redirect URIs:
```
http://localhost:3001/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
https://your-production-domain.com/api/auth/callback/google
```

5. Click "Create"

## Step 5: Copy Credentials

You'll see a popup with:
- **Client ID**: Starts with `xxx.apps.googleusercontent.com`
- **Client Secret**: Random string

**Keep these secure!**

## Step 6: Update Environment Variables

Update your `.env.local` file:

```bash
# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

## Step 7: For Vercel Production

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the following:

| Name | Value |
|------|-------|
| `GOOGLE_CLIENT_ID` | Your client ID |
| `GOOGLE_CLIENT_SECRET` | Your client secret |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` |

4. Redeploy your application

## Step 8: Update Authorized Domains

Once you have your Vercel domain:

1. Go back to Google Cloud Console → Credentials
2. Click on your OAuth client
3. Add your Vercel domain to:
   - Authorized JavaScript origins: `https://your-app.vercel.app`
   - Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`
4. Click "Save"

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI exactly matches what's in Google Console
- Include `/api/auth/callback/google` at the end
- Check for http vs https
- Check for trailing slashes

### Error: "Access blocked: This app's request is invalid"
- Check that OAuth consent screen is properly configured
- Add your email as a test user
- Make sure required scopes are added

### Error: "Configuration" on login page
- Verify NEXTAUTH_SECRET is set
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
- Check that NEXTAUTH_URL matches your current domain
- Restart your dev server after changing .env.local

### Error: "Callback URL Mismatch"
- The authorized redirect URI must exactly match the callback URL
- Format: `{NEXTAUTH_URL}/api/auth/callback/google`
- Example: `http://localhost:3001/api/auth/callback/google`

## Development vs Production

### Development (localhost:3001)
```bash
NEXTAUTH_URL="http://localhost:3001"
GOOGLE_CLIENT_ID="dev-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="dev-client-secret"
```

### Production (Vercel)
```bash
NEXTAUTH_URL="https://your-app.vercel.app"
GOOGLE_CLIENT_ID="prod-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="prod-client-secret"
```

**Note:** You can use the same OAuth client for both, or create separate ones.

## Testing

1. Start your dev server: `npm run dev`
2. Navigate to `http://localhost:3001/login`
3. Click "Continue with Google"
4. You should see Google's OAuth consent screen
5. Sign in with a test user email
6. You should be redirected to `/dashboard`

## Security Best Practices

1. **Never commit** `.env.local` to git
2. Use different OAuth clients for dev and production
3. Regularly rotate your `NEXTAUTH_SECRET`
4. Enable 2FA on your Google Cloud account
5. Monitor OAuth usage in Google Console
6. Set up proper CORS and CSP headers
7. Review and limit OAuth scopes to only what's needed

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth Google Provider](https://next-auth.js.org/providers/google)
