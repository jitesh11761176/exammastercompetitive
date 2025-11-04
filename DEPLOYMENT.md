# ExamMaster Pro - Deployment Guide

## 🚀 Quick Deploy to Vercel

### Step 1: Prepare Your Database

1. **Create Neon Database**
   - Sign up at [Neon](https://neon.tech)
   - Create a new project
   - Copy the connection string
   - It should look like: `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

### Step 2: Set Up Google OAuth

1. **Google Cloud Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Add authorized redirect URI: `https://your-domain.vercel.app/api/auth/callback/google`
   - Save Client ID and Client Secret

### Step 3: Get Google Gemini API Key

1. **Google AI Studio**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Click "Create API Key"
   - Copy the API key

### Step 4: Deploy to Vercel

1. **Push to GitHub**
```bash
cd nosejs
git init
git add .
git commit -m "Initial commit: ExamMaster Pro"
git branch -M main
git remote add origin https://github.com/yourusername/exam-master-pro.git
git push -u origin main
```

2. **Import to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure project

3. **Add Environment Variables**
   In Vercel project settings, add these variables:
   
   ```
   DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=your-generated-secret-key-here
   
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   GEMINI_API_KEY=your-gemini-api-key
   ```

   To generate NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

### Step 5: Initialize Database

1. **After first deployment**, run Prisma migrations:
   - Go to Vercel dashboard
   - Navigate to your project
   - Go to "Settings" > "Environment Variables"
   - Ensure DATABASE_URL is set
   
2. **Run database setup locally** (one-time):
```bash
# Set your production DATABASE_URL in .env
DATABASE_URL="your-production-database-url"

# Push schema to database
npx prisma db push

# Seed with sample data (optional)
npx prisma db seed
```

### Step 6: Update Google OAuth Settings

1. Go back to Google Cloud Console
2. Update OAuth redirect URIs with your Vercel domain:
   - `https://your-domain.vercel.app/api/auth/callback/google`
3. Add to "Authorized JavaScript origins":
   - `https://your-domain.vercel.app`

### Step 7: Test Your Deployment

1. Visit your Vercel URL
2. Click "Get Started" or "Login"
3. Sign in with Google
4. Create or attempt a test
5. Verify all features work

## 📊 Post-Deployment

### Monitor Performance
- Check Vercel Analytics
- Monitor database usage in Neon
- Review error logs in Vercel dashboard

### Add Custom Domain (Optional)
1. Go to Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update NEXTAUTH_URL and Google OAuth settings

### Enable Vercel KV (Optional - for caching)
1. Go to Vercel Storage
2. Create KV database
3. Add KV environment variables to your project

## 🔧 Troubleshooting

### Build Errors
- Ensure all environment variables are set
- Check Vercel build logs
- Verify DATABASE_URL format

### OAuth Errors
- Verify redirect URIs match exactly
- Check client ID and secret
- Ensure domain is added to authorized origins

### Database Connection Issues
- Verify DATABASE_URL is correct
- Ensure Neon database is active
- Check connection pooling settings

### API Rate Limits
- Monitor Gemini API usage
- Implement caching if needed
- Consider upgrading API plan

## 🎯 Production Checklist

- ✅ Database migrations completed
- ✅ Environment variables configured
- ✅ OAuth credentials updated
- ✅ Sample data seeded
- ✅ Custom domain configured (optional)
- ✅ Error monitoring enabled
- ✅ Performance monitoring enabled
- ✅ Backup strategy in place

## 🔐 Security Best Practices

1. **Never commit secrets** to git
2. **Rotate API keys** periodically
3. **Use strong NEXTAUTH_SECRET**
4. **Enable rate limiting** for APIs
5. **Monitor for suspicious activity**
6. **Keep dependencies updated**

## 📈 Scaling Considerations

- Monitor database connection pool
- Consider Redis for caching
- Implement CDN for static assets
- Use Vercel Edge Functions for API routes
- Set up database replication for read-heavy workloads

---

Need help? Check the [README.md](README.md) for more details.
