# Environment Variables Quick Reference

## 🔐 Required for Vercel Deployment

Copy this to your Vercel dashboard at:  
**Project Settings > Environment Variables**

---

## Database
```bash
DATABASE_URL="postgresql://user:password@host/db?pgbouncer=true&connection_limit=1"
```
**Note:** Use Neon's **pooled connection URL** (serverless/pooled)

---

## Authentication
```bash
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-super-secret-random-string-min-32-chars"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

## Google OAuth (if using Google login)
```bash
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"
```

**Get from:** https://console.cloud.google.com/apis/credentials

---

## AI/Gemini
```bash
GEMINI_API_KEY="your-gemini-api-key"
```

**Get from:** https://makersuite.google.com/app/apikey

---

## Payment Gateways

### Stripe
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Razorpay
```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="your_secret_key"
```

---

## Optional Services

### Redis (if using)
```bash
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### MeiliSearch (if using)
```bash
MEILISEARCH_HOST="https://..."
MEILISEARCH_MASTER_KEY="..."
```

### Cloudflare Stream (if using)
```bash
CLOUDFLARE_ACCOUNT_ID="..."
CLOUDFLARE_API_TOKEN="..."
CLOUDFLARE_STREAM_CUSTOMER_CODE="..."
```

---

## Base URL
```bash
NEXT_PUBLIC_BASE_URL="https://your-domain.vercel.app"
```

---

## ⚠️ Important Notes

1. **All Production Values:** Use production keys, not test/development
2. **No Blanks:** Every required variable must have a value
3. **Apply to All:** Set for Production, Preview, and Development environments
4. **Redeploy:** Changes to env vars require a redeploy to take effect
5. **Secrets:** Never commit these to git or share publicly

---

## 🧪 Verification

After setting variables, run in terminal:

```bash
# Install Vercel CLI
npm i -g vercel

# Pull env variables to local
vercel env pull

# Check .env.local was created
cat .env.local
```

---

## 🔄 How to Update in Vercel

1. Go to **Vercel Dashboard**
2. Select your project
3. Click **Settings** > **Environment Variables**
4. Click **Add New**
5. Enter **Key** and **Value**
6. Select environments: ✅ Production ✅ Preview ✅ Development
7. Click **Save**
8. **Redeploy** your project

---

## ✅ Checklist Before First Deploy

- [ ] DATABASE_URL set (with pooler/serverless connection)
- [ ] NEXTAUTH_URL set (your production domain)
- [ ] NEXTAUTH_SECRET set (min 32 random characters)
- [ ] GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET set (if using)
- [ ] GEMINI_API_KEY set (if using AI features)
- [ ] Payment keys set (if using Stripe/Razorpay)
- [ ] All values are production-ready (not test/dev)
- [ ] Redeploy triggered after adding env vars
- [ ] `prisma migrate deploy` run after first deployment

---

## 🚨 If You See 500 Errors

1. Check Vercel Function Logs
2. Look for missing env var errors
3. Verify DATABASE_URL is correct and reachable
4. Ensure all required vars are set (not blank)
5. Confirm you redeployed after adding env vars

