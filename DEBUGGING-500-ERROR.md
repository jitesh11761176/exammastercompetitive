# 🔍 POST /api/admin/courses 500 Error - Debugging Guide

## 📋 Quick Diagnostic Checklist

Run these tests in order to identify the root cause:

### ✅ Step 1: Test Database Connectivity

Visit: `https://your-domain.vercel.app/api/test-db`

**Expected Success:**
```json
{"ok":true,"count":0}
```

**If Failed:**
- Error indicates DB connection issue
- Check DATABASE_URL in Vercel environment variables
- Must use Neon pooled URL with `pgbouncer=true`

---

### ✅ Step 2: Test Health Endpoint

Visit: `https://your-domain.vercel.app/api/health`

**Expected Success:**
```json
{"ok":true,"ts":"2025-11-05T..."}
```

**If Failed:**
- Database connection is broken
- Migrations may not be applied
- DATABASE_URL is incorrect

---

### ✅ Step 3: Check Vercel Function Logs

**Location:** Vercel Dashboard → Project → Deployments → Latest → Logs

**Look for these patterns:**

#### A. Database Connection Errors
```
PrismaClientInitializationError
```
**Fix:** Check DATABASE_URL format

#### B. Missing Table
```
relation "courses" does not exist
```
**Fix:** Run migrations (see Step 6)

#### C. Schema Mismatch
```
P2002: Unique constraint failed on the fields: (`slug`)
P2025: Record not found
Invalid value for field
```
**Fix:** Schema mismatch or duplicate data

#### D. Validation Errors
```
Validation failed
```
**Fix:** Frontend sending incorrect payload

---

### ✅ Step 4: Verify DATABASE_URL Format

**Correct Format (Neon with pooling):**
```
postgres://user:password@ep-xxx-xxx.region.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=10
```

**Required Parameters:**
- ✅ `sslmode=require`
- ✅ `pgbouncer=true` (CRITICAL for serverless)
- ✅ `connect_timeout=10`

**In Vercel:**
1. Go to Settings → Environment Variables
2. Update DATABASE_URL
3. Redeploy

---

### ✅ Step 5: Verify Frontend Payload

**Open DevTools → Network → POST /api/admin/courses → Payload**

**Correct Payload:**
```json
{
  "title": "Test Course",
  "description": "Sample description",
  "thumbnail": "https://...",
  "icon": "📚",
  "tags": ["programming", "web"],
  "order": 0,
  "isActive": true,
  "isFree": false
}
```

**Common Issues:**
- ❌ Missing `Content-Type: application/json` header
- ❌ Sending FormData instead of JSON
- ❌ String values like `"true"` instead of boolean
- ❌ Missing required fields (title, description)

**Fix Your Frontend:**
```typescript
await fetch("/api/admin/courses", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "My Course",
    description: "Course description",
    thumbnail: "",
    icon: "",
    tags: [],
    order: 0,
    isActive: true,
    isFree: false,
  }),
});
```

---

### ✅ Step 6: Run Migrations on Vercel

**Option A: Automatic (Recommended)**

Set Build Command in Vercel:
```bash
npm run vercel-build
```

This runs: `prisma generate && prisma migrate deploy && next build`

**Option B: Manual via Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Run in Vercel environment
vercel env pull
npx prisma migrate deploy
```

---

### ✅ Step 7: Enhanced Error Logging

The route now logs detailed error information:

**What's Logged:**
- Parsed course data before DB insert
- Prisma error code (P2002, P2025, etc.)
- Error message and stack trace
- Full error object in JSON format

**Where to Find:**
Vercel Dashboard → Functions → Select the function → Logs

**What to Look For:**
```
Parsed Course Data: {
  "title": "...",
  "description": "...",
  ...
}

POST /api/admin/courses failed: {
  "code": "P2002",
  "message": "Unique constraint failed...",
  ...
}
```

---

## 🎯 Common Root Causes & Fixes

### 1. Missing Database Table ❌
**Error:** `relation "courses" does not exist`

**Fix:**
```bash
# Run migrations
npx prisma migrate deploy

# Or redeploy with correct build command
```

---

### 2. Wrong DATABASE_URL ❌
**Error:** `PrismaClientInitializationError`

**Fix:**
1. Get pooled connection URL from Neon
2. Update in Vercel → Environment Variables
3. Redeploy

---

### 3. Schema Mismatch ❌
**Error:** `Invalid value for field 'price'`

**Fix:**
Your API sends `price` but schema doesn't have it.
Remove `price` from your frontend payload.

---

### 4. Duplicate Slug ❌
**Error:** `P2002: Unique constraint failed on the fields: (slug)`

**Fix:**
Course with same title already exists.
Use different title or delete existing course.

---

### 5. Bad Frontend Payload ❌
**Error:** `Validation failed`

**Check:**
- All required fields present (title, description)
- Correct data types (boolean not string)
- JSON format, not FormData

---

## 🧪 Local Testing

Test locally before deploying:

```bash
# 1. Ensure DB is set up
npx prisma migrate dev

# 2. Generate Prisma client
npx prisma generate

# 3. Run dev server
npm run dev

# 4. Test endpoint
curl -X POST http://localhost:3001/api/admin/courses \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Course",
    "description": "Test description",
    "isActive": true
  }'
```

---

## 📊 Verification Steps

After deploying fixes:

1. ✅ `/api/health` returns `{"ok":true}`
2. ✅ `/api/test-db` returns `{"ok":true,"count":...}`
3. ✅ `/api/admin/courses` GET returns `{"data":[...]}`
4. ✅ `/api/admin/courses` POST creates course successfully
5. ✅ No errors in Vercel function logs

---

## 🚨 Emergency Quick Fix

If still failing after all checks:

1. **Force rebuild from scratch:**
   - Clear Vercel build cache
   - Redeploy

2. **Check Prisma schema locally:**
   ```bash
   npx prisma validate
   npx prisma format
   ```

3. **Regenerate Prisma client:**
   ```bash
   rm -rf node_modules/.prisma
   npx prisma generate
   ```

4. **Test DB connection directly:**
   ```bash
   npx prisma db pull
   ```

---

## 📞 Support

If issue persists, provide:
1. Full error from Vercel logs
2. Screenshot of Network tab (payload + response)
3. DATABASE_URL format (redact password)
4. Output from `/api/test-db`

