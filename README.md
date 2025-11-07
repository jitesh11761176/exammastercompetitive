# ExamMaster Pro

A complete, production-ready competitive exam preparation web application with AI-powered features, real-time testing, analytics, and gamification.

![ExamMaster Pro](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Firebase](https://img.shields.io/badge/Firebase-11.0-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Features

### Core Features
- 🔐 **Authentication** - Google OAuth with NextAuth.js
- 📝 **Test Management** - Create, browse, and attempt tests
- ⏱️ **Real-time Exam Interface** - Timer, question navigation, auto-submit
- 📊 **Analytics Dashboard** - Performance tracking with charts
- 🏆 **Gamification** - Points, levels, badges, and leaderboard
- 🤖 **AI Integration** - Question generation and doubt clarification with Google Gemini
- 📱 **PWA Support** - Offline-capable with service workers
- 💾 **Offline Storage** - IndexedDB for local data persistence
- 🎨 **Modern UI** - Tailwind CSS with shadcn/ui components
- 🌙 **Dark Mode** - System-aware theme switching

### Technical Features
- Server-side rendering with Next.js 14 App Router
- Firebase Firestore for real-time database
- Firebase Authentication & Analytics
- State management with Zustand
- Responsive design for all devices
- Production-ready deployment configuration

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** Firebase Firestore (NoSQL)
- **Authentication:** Firebase Auth + NextAuth.js
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand
- **AI:** Google Gemini 2.0 Flash
- **Charts:** Recharts
- **Icons:** Lucide React
- **Deployment:** Vercel

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Firebase project (free tier available)
- Google OAuth credentials (optional)
- Google Gemini API key (optional)

### Steps

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd nosejs
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
# Firebase Configuration (Required)
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"

# NextAuth (Optional)
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Google Gemini AI (Optional)
GEMINI_API_KEY="your-gemini-api-key"
```

4. **Set up Firebase Firestore**
- Go to [Firebase Console](https://console.firebase.google.com)
- Create/select your project
- Enable Firestore Database
- Set up security rules (see FIREBASE-SETUP-COMPLETE.md)

5. **Run the development server**
```bash
npm run dev
```

Visit [http://localhost:3001](http://localhost:3001)

## 🗄️ Firestore Collections

The application uses the following main collections:
- **users** - User profiles with points, levels, and streaks
- **tests** - Test metadata and settings
- **questions** - Individual questions with options and answers
- **testAttempts** - User test submissions with scores
- **categories** - Test categories
- **courses** - Course information
- **enrollments** - User course enrollments
- **analytics** - User performance analytics

See `FIREBASE-SETUP-COMPLETE.md` for detailed collection structure and security rules.

## 🔑 Getting API Keys

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

### Google Gemini
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Copy the key to your `.env.local`

### Firebase
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing
3. Go to Project Settings → General
4. Scroll to "Your apps" section
5. Copy the Firebase config values
6. Add all values to `.env.local` with `NEXT_PUBLIC_` prefix

## 📁 Project Structure

```
exam-master-pro/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Dashboard pages
│   ├── test/[id]/       # Exam interface
│   ├── api/             # API routes
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Homepage
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── test/            # Test-related components
│   └── analytics/       # Analytics components
├── lib/
│   ├── firebase.ts           # Firebase configuration
│   ├── firestore-helpers.ts  # Firestore utility functions
│   ├── auth.ts               # NextAuth config
│   ├── gemini.ts             # AI functions
│   ├── store.ts              # Zustand stores
│   └── utils.ts              # Utility functions
└── public/              # Static assets
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Deploy to Vercel**
- Import your repository in [Vercel](https://vercel.com)
- Add environment variables
- Deploy

3. **Update OAuth redirect URIs**
- Add your Vercel domain to Google OAuth settings
- Update `NEXTAUTH_URL` in Vercel environment variables

## 🎯 Usage

### For Students
1. Sign in with Google
2. Browse available tests
3. Start a test and answer questions
4. View results and analytics
5. Track progress on leaderboard
6. Use AI doubt clarification

### For Admins
1. Access admin panel at `/admin`
2. Create tests and questions via admin UI
3. Set difficulty levels and time limits
4. Monitor user performance through Firebase Console
5. Manage content directly in Firestore Database

## 🔧 Configuration

### PWA Settings
Edit `public/manifest.json` to customize:
- App name and description
- Theme colors
- Icons

### Tailwind Theme
Edit `tailwind.config.ts` for custom colors:
```ts
colors: {
  primary: "...",    // Main brand color
  secondary: "...",  // Secondary color
  accent: "...",     // Accent color
}
```

## 📊 Features in Detail

### Real-time Exam Interface
- Auto-save answers locally
- Visual question palette
- Mark for review
- Time warnings
- Auto-submit on timeout

### Analytics
- Performance trends over time
- Subject-wise analysis
- Difficulty-wise breakdown
- Comparison with peers

### Gamification
- Points system based on performance
- Level progression
- Achievement badges
- Global leaderboard

### AI Features
- Generate practice questions on any topic
- AI-powered doubt clarification
- Performance insights and recommendations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and deployment
- shadcn for the beautiful UI components
- Google for Gemini AI API

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Contact: your-email@example.com

---

Made with ❤️ using Next.js 14 and TypeScript
