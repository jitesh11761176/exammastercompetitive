# 🚀 ExamMaster Pro - Complete Installation Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start (5 minutes)](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Getting API Credentials](#getting-api-credentials)
5. [Running the Application](#running-the-application)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 18+** and npm installed
  - Download from: https://nodejs.org
  - Verify: `node --version` should show v18 or higher

- ✅ **Git** installed (optional, for version control)
  - Download from: https://git-scm.com

- ✅ **Code Editor** (VS Code recommended)
  - Download from: https://code.visualstudio.com

---

## Quick Start

### Option 1: Automated Setup (PowerShell on Windows)

```powershell
# Navigate to project directory
cd "d:\website competitive\nosejs"

# Run setup script
.\setup.ps1
```

The script will:
- Install dependencies
- Create .env.local from template
- Generate Prisma client
- Set up database (optional)
- Seed sample data (optional)
- Start dev server (optional)

### Option 2: Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env.local

# 3. Edit .env.local with your credentials
# (See "Getting API Credentials" section)

# 4. Generate Prisma client
npx prisma generate

# 5. Push database schema
npx prisma db push

# 6. Seed database (optional)
npx tsx prisma/seed.ts

# 7. Start development server
npm run dev
```

Visit: http://localhost:3000

---

## Detailed Setup

### Step 1: Install Dependencies

```bash
npm install
```

This installs all required packages:
- Next.js 14
- React 18
- Prisma ORM
- NextAuth.js
- Tailwind CSS
- And more...

### Step 2: Set Up Environment Variables

1. Copy the example file:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` with your favorite text editor

3. Fill in the required values (see next section)

### Step 3: Configure Database

```bash
# Generate Prisma Client
npx prisma generate

# Create tables in your database
npx prisma db push

# (Optional) Load sample data
npx tsx prisma/seed.ts
```

### Step 4: Start Development Server

```bash
npm run dev
```

Your app will be available at http://localhost:3000

---

## Getting API Credentials

### 1. Neon PostgreSQL Database

**Free Tier Available** ✅

1. **Sign up at Neon**
   - Visit: https://neon.tech
   - Click "Sign Up"
   - Use GitHub or email

2. **Create a Project**
   - Click "New Project"
   - Choose a name (e.g., "exammaster-db")
   - Select region closest to you
   - Click "Create Project"

3. **Get Connection String**
   - On project dashboard, find "Connection string"
   - Copy the full connection string
   - It looks like:
     ```
     postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
     ```

4. **Add to .env.local**
   ```env
   DATABASE_URL="postgresql://your-connection-string-here"
   ```

### 2. Google OAuth Credentials

**Free** ✅

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Sign in with Google account

2. **Create a Project**
   - Click project dropdown (top left)
   - Click "New Project"
   - Name it "ExamMaster Pro"
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click and enable it

4. **Create OAuth Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Configure consent screen if prompted:
     - User Type: External
     - App name: ExamMaster Pro
     - User support email: your email
     - Developer contact: your email
   - Application type: Web application
   - Name: ExamMaster Pro Web Client
   - Authorized redirect URIs:
     - For development: `http://localhost:3000/api/auth/callback/google`
     - For production: `https://your-domain.com/api/auth/callback/google`
   - Click "Create"

5. **Copy Credentials**
   - You'll see Client ID and Client Secret
   - Copy both values

6. **Add to .env.local**
   ```env
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

### 3. Google Gemini API Key

**Free Tier Available** ✅

1. **Go to Google AI Studio**
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with Google account

2. **Create API Key**
   - Click "Create API Key"
   - Select project (or create new one)
   - Copy the generated API key

3. **Add to .env.local**
   ```env
   GEMINI_API_KEY="your-api-key-here"
   ```

### 4. NextAuth Secret

**Generate Locally** ✅

**On Windows (PowerShell):**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

**Or use online generator:**
- Visit: https://generate-secret.vercel.app/32

**Add to .env.local:**
```env
NEXTAUTH_SECRET="your-generated-secret-here"
```

### 5. Complete .env.local Example

```env
# Database
DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-32-char-random-secret"

# Google OAuth
GOOGLE_CLIENT_ID="123456789.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxx"

# Google Gemini AI
GEMINI_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# Optional: Cloudinary (for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

---

## Running the Application

### Development Mode

```bash
npm run dev
```
- Runs on http://localhost:3000
- Hot reload enabled
- Shows detailed errors

### Production Build (Local Testing)

```bash
# Build the application
npm run build

# Start production server
npm start
```
- Optimized build
- Runs on http://localhost:3000
- Production-like environment

### Database Management

```bash
# Open Prisma Studio (Database GUI)
npx prisma studio

# Generate Prisma Client
npx prisma generate

# Push schema changes
npx prisma db push

# Create migration
npx prisma migrate dev --name init

# Seed database
npx tsx prisma/seed.ts
```

---

## Troubleshooting

### Common Issues

#### 1. "Cannot find module '@prisma/client'"

**Solution:**
```bash
npx prisma generate
```

#### 2. "Database connection error"

**Check:**
- DATABASE_URL is correct in .env.local
- Neon database is active
- Connection string includes `?sslmode=require`

**Test connection:**
```bash
npx prisma db push
```

#### 3. "OAuth error" or "Redirect URI mismatch"

**Check:**
- Redirect URI in Google Console matches exactly
- For local: `http://localhost:3000/api/auth/callback/google`
- No trailing slashes
- Protocol is correct (http vs https)

#### 4. "Module not found" errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Or on Windows:
rmdir /s node_modules
npm install
```

#### 5. TypeScript/ESLint errors

**Note:** These are expected until dependencies are installed.

**Fix:**
```bash
npm install
```

#### 6. Port 3000 already in use

**Solution:**
```bash
# On Windows:
netstat -ano | findstr :3000
taskkill /PID <pid> /F

# On Mac/Linux:
lsof -ti:3000 | xargs kill

# Or use different port:
PORT=3001 npm run dev
```

#### 7. Gemini API errors

**Check:**
- API key is correct
- You haven't exceeded free tier limits
- API is enabled in your Google Cloud project

---

## Next Steps

After successful installation:

1. **Test the application:**
   - Sign in with Google
   - Browse tests
   - Take a test
   - View analytics
   - Check leaderboard

2. **Customize:**
   - Update branding (logo, colors)
   - Add more tests
   - Configure badges
   - Customize scoring system

3. **Deploy:**
   - See DEPLOYMENT.md for production deployment
   - Set up monitoring
   - Configure custom domain

4. **Develop:**
   - Add new features
   - Enhance UI/UX
   - Optimize performance
   - Add more question types

---

## Additional Resources

- **Documentation:**
  - README.md - Project overview
  - DEPLOYMENT.md - Deployment guide
  - PROJECT_SUMMARY.md - Complete feature list
  - CHECKLIST.md - Pre-launch checklist

- **External Docs:**
  - [Next.js Documentation](https://nextjs.org/docs)
  - [Prisma Documentation](https://www.prisma.io/docs)
  - [NextAuth.js](https://next-auth.js.org)
  - [Tailwind CSS](https://tailwindcss.com/docs)

- **Community:**
  - [Next.js Discord](https://discord.gg/nextjs)
  - [Prisma Discord](https://discord.gg/prisma)

---

## Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review error messages carefully
3. Check console logs in browser (F12)
4. Review terminal output
5. Consult documentation
6. Search for similar issues online

---

**Happy Coding! 🚀**
