# Vercel Deployment Commands - Quick Reference

## 🚀 Deployment Workflow

### Option 1: Automatic Deploy (Recommended)
Just push to GitHub - Vercel deploys automatically!

```bash
git add .
git commit -m "fix: Add Node runtime to Prisma routes for Vercel"
git push origin main
```

Vercel will:
1. ✅ Install dependencies (`npm ci`)
2. ✅ Run `postinstall` → generates Prisma client
3. ✅ Build Next.js app
4. ✅ Deploy to production

---

### Option 2: Manual Deploy via CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## 🗄️ Database Migrations

### After First Deployment

Run this ONCE after your first successful deployment:

```bash
# Option A: Using Vercel CLI locally
npx prisma migrate deploy

# Option B: In Vercel project dashboard
# Go to: Settings > Functions > Terminal
# Then run:
npx prisma migrate deploy
```

**What this does:**
- Applies all pending migrations to your production database
- Creates/updates tables based on your schema
- Required for API routes to work

---

## 🔍 View Deployment Logs

### Real-time Logs (during deployment)
```bash
vercel logs --follow
```

### View specific deployment logs
```bash
vercel logs <deployment-url>
```

### View production logs
```bash
vercel logs --prod
```

---

## 🧪 Test Your Deployment

### 1. Test Health Endpoint
```bash
curl https://your-domain.vercel.app/api/health
```

**Expected:**
```json
{"ok":true,"ts":"2025-11-05T..."}
```

### 2. Test Admin Health (more detailed)
```bash
curl https://your-domain.vercel.app/api/admin/health
```

**Expected:**
```json
{
  "status": "ok",
  "database": [...],
  "courseCount": 0,
  "prismaVersion": "5.22.0",
  "timestamp": "2025-11-05T..."
}
```

### 3. Test Admin Courses API
First, login as admin in browser, then:

```bash
# In browser console:
fetch('/api/admin/courses', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log)
```

**Expected:**
```json
{
  "data": [...]
}
```

---

## 🔧 Troubleshooting Commands

### Check environment variables
```bash
# Pull env vars from Vercel
vercel env pull

# View the downloaded .env.local
cat .env.local
```

### Inspect specific deployment
```bash
# List recent deployments
vercel ls

# Inspect a deployment
vercel inspect <deployment-url>
```

### Open deployment in browser
```bash
vercel --prod --open
```

### Rebuild without cache
```bash
vercel --prod --force
```

---

## 🔄 Common Workflows

### After Schema Changes
```bash
# 1. Create migration
npx prisma migrate dev --name your_migration_name

# 2. Commit changes
git add .
git commit -m "chore: Update database schema"
git push

# 3. After deploy, run migrations
npx prisma migrate deploy
```

### Force Redeploy (no code changes)
```bash
vercel --prod --force
```

### Rollback to Previous Deployment
```bash
# List deployments
vercel ls

# Promote a previous deployment
vercel promote <deployment-url>
```

---

## 📊 Monitor Your App

### View function invocations
```bash
vercel logs --prod --since 1h
```

### View errors only
```bash
vercel logs --prod --since 1h | grep "Error"
```

### Continuous monitoring
```bash
vercel logs --prod --follow
```

---

## 🌍 Domain Management

### Add custom domain
```bash
vercel domains add your-domain.com
```

### List domains
```bash
vercel domains ls
```

### Remove domain
```bash
vercel domains rm your-domain.com
```

---

## 🔐 Environment Variables via CLI

### Add new variable
```bash
vercel env add VARIABLE_NAME
```

### List all variables
```bash
vercel env ls
```

### Pull variables to local
```bash
vercel env pull .env.local
```

### Remove variable
```bash
vercel env rm VARIABLE_NAME production
```

---

## 💾 Prisma Studio (Database GUI)

### Local (development)
```bash
npx prisma studio
```

### Production (via env vars)
```bash
# First pull production env vars
vercel env pull .env.production

# Then run studio with production env
npx dotenv -e .env.production -- prisma studio
```

**WARNING:** Be careful when editing production data!

---

## 📈 Performance Analysis

### Analyze bundle size
```bash
npm run build
```

Check the output for:
- Route segment sizes
- First Load JS sizes
- Lambda function sizes

### View build analytics in Vercel
```bash
vercel --prod
# Then check: Dashboard > Analytics > Speed Insights
```

---

## 🚨 Emergency Procedures

### Instant Rollback
```bash
# List recent deployments
vercel ls

# Promote last known good deployment
vercel promote <previous-deployment-url>
```

### Check if site is down
```bash
curl -I https://your-domain.vercel.app/api/health
```

### View live error logs
```bash
vercel logs --prod --follow | grep "500"
```

---

## ✅ Pre-Deployment Checklist

Run these commands before deploying:

```bash
# 1. Type check
npm run lint

# 2. Build locally
npm run build

# 3. Test locally
npm run start

# 4. Generate Prisma client
npx prisma generate

# 5. Verify migrations
npx prisma migrate diff

# 6. Commit and push
git add .
git commit -m "feat: Your changes"
git push
```

---

## 🎯 Quick Commands Reference

| Task | Command |
|------|---------|
| Deploy to preview | `vercel` |
| Deploy to production | `vercel --prod` |
| View logs | `vercel logs --prod` |
| Pull env vars | `vercel env pull` |
| Run migrations | `npx prisma migrate deploy` |
| Open Prisma Studio | `npx prisma studio` |
| Rollback | `vercel promote <url>` |
| Force rebuild | `vercel --prod --force` |

---

## 📞 Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Discord:** https://vercel.com/discord
- **Prisma Docs:** https://www.prisma.io/docs
- **Next.js Docs:** https://nextjs.org/docs

---

## 🎉 Success Indicators

Your deployment is successful when:

✅ Build completes without errors  
✅ `/api/health` returns `{"ok":true}`  
✅ `/api/admin/health` shows database connection  
✅ No 500 errors in Vercel Function logs  
✅ Admin routes load correctly  
✅ User-facing pages work  

