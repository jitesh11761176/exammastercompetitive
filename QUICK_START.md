# 🚀 Quick Start Guide - ExamMaster Pro

## Get Up and Running in 5 Minutes!

### Step 1: Start the Development Server ▶️
```powershell
cd "d:\website competitive\nosejs"
npm run dev
```

**Expected Output:**
```
▲ Next.js 14.2.0
- Local:        http://localhost:3000
✓ Ready in 2s
```

### Step 2: Open Your Browser 🌐
Visit: **http://localhost:3000**

You'll see the beautiful landing page with:
- Hero section with "ExamMaster Pro" branding
- Feature cards showcasing platform benefits
- Call-to-action buttons

### Step 3: Try Logging In 🔐

Click "Login" or "Get Started" button

**Login Page Features:**
- ✨ Animated gradient background
- 📱 Mobile responsive design
- 🎯 Feature carousel (auto-rotates every 4s)
- 📊 Stats display (50K+ users, 95% success rate)
- 💬 User testimonials
- 🔘 "Continue with Google" button

### Step 4: Set Up Google OAuth (Required for Login)

**Quick Setup:**
1. Go to: https://console.cloud.google.com
2. Create a new project (or use existing)
3. Navigate to: **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure consent screen (if needed)
6. Application type: **Web application**
7. Add authorized redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
8. Copy **Client ID** and **Client Secret**
9. Update your `.env` file:
   ```env
   GOOGLE_CLIENT_ID="your-client-id-here"
   GOOGLE_CLIENT_SECRET="your-client-secret-here"
   ```
10. Restart the dev server (Ctrl+C, then `npm run dev`)

### Step 5: Sign In and Explore! 🎉

After signing in with Google:

1. **Dashboard** - Your main hub
   - View your level and stats
   - See recent activity
   - Quick access to tests

2. **Sidebar Navigation** - Access all features
   - 🏠 Dashboard
   - 📝 Tests
   - 📊 Analytics
   - 🏆 Leaderboard
   - 👤 Profile

3. **Theme Toggle** - Try dark mode!
   - Click the theme icon in the header
   - Smooth transition between light/dark

4. **User Menu** - Manage your account
   - View your profile info
   - Check your level
   - Sign out

## 🗄️ View Your Database

Open Prisma Studio to see and edit data:
```powershell
npx prisma studio
```

Opens at: **http://localhost:5555**

You can:
- Browse all database tables
- View seeded data (categories, subjects, topics, tests, badges)
- Edit records
- Add new data
- Delete entries

**Seeded Data Includes:**
- 8 Categories (SSC, Banking, Railways, UPSC, etc.)
- 25 Subjects (Math, English, GK, Reasoning, etc.)
- 36 Topics across all subjects
- 5 Sample questions with explanations
- 5 Sample tests (different difficulty levels)
- 16 Achievement badges (4 rarity tiers)

## 🎨 Customize Your App

### Change Theme Colors
Edit `tailwind.config.ts`:
```typescript
colors: {
  primary: {
    DEFAULT: '#4F46E5',  // Change this for primary color
    // ... other shades
  },
  secondary: {
    DEFAULT: '#10B981',  // Change this for secondary color
    // ... other shades
  }
}
```

### Modify App Metadata
Edit `app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  title: 'Your App Name',
  description: 'Your description',
  // ... other metadata
}
```

## 🔍 What to Test

### 1. Landing Page (/)
- ✅ Responsive design (resize browser)
- ✅ Navigation menu
- ✅ Feature cards
- ✅ CTA buttons

### 2. Login Page (/login)
- ✅ Gradient background animation
- ✅ Feature carousel auto-rotation
- ✅ Mobile layout
- ✅ Google sign-in button

### 3. Dashboard (/dashboard) - After Login
- ✅ Sidebar navigation
- ✅ User info display
- ✅ Level calculation
- ✅ Mobile responsive drawer
- ✅ Sign out functionality

### 4. Dark Mode
- ✅ Toggle in header
- ✅ Persistent across page reloads
- ✅ Smooth transitions
- ✅ All pages support dark mode

## 📝 Common Commands

```powershell
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run database migrations
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed database
npm run prisma:seed

# Open Prisma Studio
npx prisma studio

# Format code
npx prettier --write .

# Lint code
npm run lint
```

## 🐛 Quick Fixes

### "Module not found" errors
```powershell
npm install
```

### Port 3000 already in use
- App will auto-use port 3001
- Or kill the process using port 3000

### Authentication not working
1. Check `.env` file has correct Google credentials
2. Verify redirect URI in Google Console
3. Clear browser cookies
4. Restart dev server

### Database connection issues
1. Check `DATABASE_URL` in `.env`
2. Ensure Neon database is active
3. Run `npx prisma db push`

### Styling not working
1. Check if `npm run dev` is running
2. Clear browser cache (Ctrl+Shift+R)
3. Delete `.next` folder and restart

## 🎯 Next Steps

1. **Add More Questions** - Use Prisma Studio to add questions
2. **Create Tests** - Configure new tests with your questions
3. **Customize Branding** - Update colors, logos, text
4. **Test Features** - Try all navigation items
5. **Deploy** - Push to Vercel or other hosting

## 📞 Need Help?

- Check `SETUP_COMPLETE.md` for detailed info
- See `README.md` for full documentation
- Review error messages in terminal
- Check browser console for client errors

## ✅ Checklist

Before you start building features:

- [ ] Dev server running (`npm run dev`)
- [ ] Can access landing page (http://localhost:3000)
- [ ] Google OAuth credentials added to `.env`
- [ ] Can sign in with Google
- [ ] Can access dashboard after login
- [ ] Prisma Studio works (`npx prisma studio`)
- [ ] Database has seeded data
- [ ] Dark mode toggle works
- [ ] Mobile responsive design works

## 🎉 You're Ready!

Everything is set up and working. Now you can:

1. **Explore** - Navigate through all pages
2. **Customize** - Make it your own
3. **Build** - Add new features
4. **Deploy** - Share with users

**Happy Coding! 🚀**

---

**Pro Tip:** Keep Prisma Studio open in one tab and your app in another for easy data management while developing!
