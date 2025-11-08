# 🔥 Vercel Firebase Environment Variables Setup

## ⚠️ CRITICAL: Client-Side Variables Required

For Firebase to work in the browser (client-side), you **MUST** add these environment variables to Vercel with the `NEXT_PUBLIC_` prefix.

## 📋 Required Environment Variables

Go to your Vercel dashboard → Your Project → Settings → Environment Variables

Add these variables for **Production**, **Preview**, and **Development**:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBKzn1lc9CW0Fd79y7-n2YJhJ-E2KGpMiE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=exammasterpro-a09ed.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=exammasterpro-a09ed
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=exammasterpro-a09ed.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=785685933068
NEXT_PUBLIC_FIREBASE_APP_ID=1:785685933068:web:6507904f5fcf5b7d4d0a99
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-3YL4LXVX8J
```

## 🔐 Also Add Server-Side Variables (for API routes)

```bash
FIREBASE_API_KEY=AIzaSyBKzn1lc9CW0Fd79y7-n2YJhJ-E2KGpMiE
FIREBASE_AUTH_DOMAIN=exammasterpro-a09ed.firebaseapp.com
FIREBASE_PROJECT_ID=exammasterpro-a09ed
FIREBASE_STORAGE_BUCKET=exammasterpro-a09ed.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=785685933068
FIREBASE_APP_ID=1:785685933068:web:6507904f5fcf5b7d4d0a99
FIREBASE_MEASUREMENT_ID=G-3YL4LXVX8J
```

## 📝 Step-by-Step Instructions

1. **Open Vercel Dashboard**: https://vercel.com/dashboard
2. **Select Your Project**: Click on `exammastercompetitive`
3. **Go to Settings**: Click "Settings" tab
4. **Environment Variables**: Click "Environment Variables" in the left sidebar
5. **Add Each Variable**:
   - Click "Add New"
   - Name: `NEXT_PUBLIC_FIREBASE_API_KEY`
   - Value: `AIzaSyBKzn1lc9CW0Fd79y7-n2YJhJ-E2KGpMiE`
   - Select: ✅ Production ✅ Preview ✅ Development
   - Click "Save"
6. **Repeat** for all 14 variables above (7 NEXT_PUBLIC + 7 server-side)
7. **Redeploy**: Go to Deployments → ... → Redeploy

## ❓ Why Both Prefixes?

- **NEXT_PUBLIC_*** = Exposed to browser (client-side React components)
- **FIREBASE_*** = Server-side only (API routes, server components)

## ✅ After Adding Variables

Once you've added all variables and redeployed:

1. Visit your admin panel: `https://your-app.vercel.app/admin/courses`
2. Click "Create Course"
3. The course should now save successfully! 🎉

## 🐛 Debugging

If it still doesn't work:
1. Open browser console (F12)
2. Look for `[Firebase]` logs
3. Check what config values are present
4. Verify all variables are set on Vercel

## 🔗 Quick Links

- Vercel Dashboard: https://vercel.com/dashboard
- Firebase Console: https://console.firebase.google.com
- Your Project: exammasterpro-a09ed
