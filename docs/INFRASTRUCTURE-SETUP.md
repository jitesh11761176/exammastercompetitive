# Production Infrastructure Setup Guide

## Overview
Complete setup for monitoring, background jobs, security, and database enhancements.

---

## Step 1: Database Migration

Run the comprehensive migration to add all new models:

```powershell
cd "d:\website competitive\nosejs"

# Run migration
npx prisma migrate dev --name infrastructure_security_monitoring

# Generate Prisma Client
npx prisma generate
```

This adds:
- **Monitoring**: AuditLog, ErrorLog, SystemMetric
- **Background Jobs**: Job model with BullMQ integration
- **Security**: RateLimitLog, ApiKey, SecurityEvent
- **Caching**: CacheEntry model
- **Events**: Event, Webhook, WebhookDelivery

---

## Step 2: Install Required Packages

```powershell
# Monitoring & Error Tracking
npm install @sentry/nextjs

# Background Jobs
npm install bullmq ioredis

# Validation
npm install zod

# Email Service
npm install resend

# Rate Limiting (for API routes)
npm install express-rate-limit

# Security Headers
npm install helmet

# CSV/Excel Export
npm install papaparse xlsx
npm install -D @types/papaparse

# PDF Generation
npm install @react-pdf/renderer puppeteer
npm install -D @types/puppeteer
```

---

## Step 3: Setup Redis

### Option A: Local Redis (Development)

**Windows (using Chocolatey)**:
```powershell
choco install redis-64

# Start Redis
redis-server
```

**Windows (using Docker)**:
```powershell
docker run -d -p 6379:6379 --name redis redis:latest
```

### Option B: Cloud Redis (Production)

**Recommended Services**:
- **Upstash**: https://upstash.com (Serverless Redis, free tier)
- **Redis Cloud**: https://redis.com/try-free
- **AWS ElastiCache**: For AWS deployments

---

## Step 4: Setup Sentry

1. **Create Sentry Account**: https://sentry.io
2. **Create New Project**: Select "Next.js"
3. **Get DSN**: Copy your DSN from project settings

---

## Step 5: Configure Environment Variables

Add to `.env`:

```env
# ===== Redis Configuration =====
REDIS_URL=redis://localhost:6379
# For Upstash: redis://:password@endpoint.upstash.io:6379

# ===== Sentry Configuration =====
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=your_auth_token_here
SENTRY_ORG=your_organization
SENTRY_PROJECT=your_project

# ===== Email Configuration (Resend) =====
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=ExamMaster Pro <noreply@exammaster.com>

# ===== Security =====
RATE_LIMIT_ENABLED=true
CSRF_ENABLED=true

# Content Security Policy
CSP_ENABLED=true

# ===== Background Jobs =====
ENABLE_WORKERS=true
WORKER_CONCURRENCY=5

# ===== Feature Flags =====
ENABLE_AI_FEATURES=true
ENABLE_SEARCH=true
ENABLE_NOTIFICATIONS=true
ENABLE_AUDIT_LOGS=true

# ===== Already Configured =====
# DATABASE_URL=...
# NEXTAUTH_SECRET=...
# OPENAI_API_KEY=...
# MEILISEARCH_HOST=...
```

---

## Step 6: Initialize Sentry

Create `sentry.client.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
})
```

Create `sentry.server.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

Create `sentry.edge.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

---

## Step 7: Start Background Workers

Create `worker.ts` in project root:
```typescript
import './lib/queue/workers'
import { logger } from './lib/monitoring/logger'

logger.info('Background workers started')

// Keep process alive
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing workers')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing workers')
  process.exit(0)
})
```

Start workers in separate terminal:
```powershell
npx tsx worker.ts
```

Or add to `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "worker": "tsx worker.ts",
    "dev:all": "concurrently \"npm run dev\" \"npm run worker\""
  }
}
```

Then run:
```powershell
npm install concurrently --save-dev
npm run dev:all
```

---

## Step 8: Configure Security Headers

Create/update `next.config.js`:
```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.openai.com https://*.sentry.io",
    ].join('; ')
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
```

---

## Step 9: Setup Email Service (Resend)

1. **Create Account**: https://resend.com
2. **Verify Domain**: Add DNS records for your domain
3. **Get API Key**: From dashboard
4. **Create Email Templates**: In `emails/` directory

Example template (`emails/WelcomeEmail.tsx`):
```typescript
import { Html, Head, Body, Container, Text, Button } from '@react-email/components'

export default function WelcomeEmail({ name }: { name: string }) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Text>Welcome to ExamMaster Pro, {name}!</Text>
          <Text>Start your journey to exam success today.</Text>
          <Button href="https://exammaster.com/dashboard">
            Go to Dashboard
          </Button>
        </Container>
      </Body>
    </Html>
  )
}
```

---

## Step 10: Implement Rate Limiting Middleware

Create `middleware.ts` in project root:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimit, getClientIP } from './lib/security'
import { RATE_LIMITS } from './lib/security'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Apply rate limiting
  if (pathname.startsWith('/api/')) {
    const ip = getClientIP(request)
    
    // Determine rate limit config based on endpoint
    let config = RATE_LIMITS.api
    
    if (pathname.startsWith('/api/auth/')) {
      config = RATE_LIMITS.auth
    } else if (pathname.startsWith('/api/ai/')) {
      config = RATE_LIMITS.ai
    } else if (pathname.startsWith('/api/export/')) {
      config = RATE_LIMITS.export
    } else if (pathname.startsWith('/api/search/')) {
      config = RATE_LIMITS.search
    }
    
    const result = await checkRateLimit(ip, 'ip', pathname, config)
    
    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString()
          }
        }
      )
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

## Step 11: Implement Audit Logging

Create audit middleware wrapper:
```typescript
// lib/api/with-audit.ts
import { NextRequest } from 'next/server'
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/monitoring/audit'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export function withAudit<T>(
  action: string,
  resource: string,
  handler: (req: NextRequest) => Promise<T>
) {
  return async (req: NextRequest) => {
    const start = performance.now()
    const session = await getServerSession(authOptions)
    
    const context = {
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req),
    }
    
    try {
      const result = await handler(req)
      const duration = performance.now() - start
      
      await createAuditLog(
        action,
        context,
        { resource, duration },
        'SUCCESS'
      )
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      
      await createAuditLog(
        action,
        context,
        { resource, duration },
        'FAILURE',
        error instanceof Error ? error.message : 'Unknown error'
      )
      
      throw error
    }
  }
}
```

Usage in API routes:
```typescript
import { withAudit } from '@/lib/api/with-audit'

export const POST = withAudit(
  'QUESTION_CREATE',
  'Question',
  async (req) => {
    // Your handler logic
  }
)
```

---

## Step 12: Setup Cron Jobs (Cleanup & Maintenance)

Create `lib/cron/cleanup.ts`:
```typescript
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/monitoring/logger'
import { cleanQueue } from '@/lib/queue'

export async function cleanupOldLogs() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  // Clean error logs
  const deletedErrors = await prisma.errorLog.deleteMany({
    where: {
      createdAt: { lt: thirtyDaysAgo },
      severity: { in: ['DEBUG', 'INFO'] },
    },
  })
  
  logger.info(`Cleaned ${deletedErrors.count} old error logs`)
  
  // Clean audit logs (keep critical ones)
  const deletedAudits = await prisma.auditLog.deleteMany({
    where: {
      createdAt: { lt: thirtyDaysAgo },
      status: 'SUCCESS',
    },
  })
  
  logger.info(`Cleaned ${deletedAudits.count} old audit logs`)
  
  // Clean completed jobs
  await cleanQueue('default', { status: 'completed', grace: 7 * 24 * 60 * 60 * 1000 })
  await cleanQueue('scoring', { status: 'completed', grace: 7 * 24 * 60 * 60 * 1000 })
}

export async function cleanupExpiredSessions() {
  const deletedSessions = await prisma.session.deleteMany({
    where: {
      expires: { lt: new Date() },
    },
  })
  
  logger.info(`Cleaned ${deletedSessions.count} expired sessions`)
}

export async function cleanupExpiredCaches() {
  const deletedCaches = await prisma.cacheEntry.deleteMany({
    where: {
      expiresAt: {
        not: null,
        lt: new Date(),
      },
    },
  })
  
  logger.info(`Cleaned ${deletedCaches.count} expired cache entries`)
}
```

Add cron API route (`app/api/cron/cleanup/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { cleanupOldLogs, cleanupExpiredSessions, cleanupExpiredCaches } from '@/lib/cron/cleanup'

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  await cleanupOldLogs()
  await cleanupExpiredSessions()
  await cleanupExpiredCaches()
  
  return NextResponse.json({ success: true })
}
```

Setup in Vercel (or other host):
- Add cron job in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

---

## Step 13: Testing

### Test Rate Limiting
```bash
# Make multiple rapid requests
for i in {1..10}; do curl http://localhost:3001/api/tests; done
```

### Test Background Jobs
```typescript
import { addJob } from '@/lib/queue'

// Add test scoring job
await addJob('scoring', 'score-test', {
  testAttemptId: 'xxx',
  userId: 'yyy',
})
```

### Test Audit Logs
Check Prisma Studio:
```powershell
npx prisma studio
```

### Test Error Logging
```typescript
import { logger } from '@/lib/monitoring/logger'

logger.error('Test error', {
  userId: 'test-user',
  path: '/api/test',
})
```

---

## Step 14: Monitoring Dashboard

### Access Sentry Dashboard
- View errors: https://sentry.io
- Check performance
- Review session replays

### BullMQ Dashboard (Optional)
```powershell
npm install @bull-board/api @bull-board/nextjs

# Add to app/api/admin/queues/route.ts
```

### System Metrics
Query from database:
```sql
SELECT name, AVG(value) as avg_value, MAX(value) as max_value
FROM system_metrics
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY name;
```

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Requests                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js Middleware                          │
│  - Rate Limiting                                             │
│  - CSRF Protection                                           │
│  - Security Headers                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes                                │
│  - Zod Validation                                            │
│  - Audit Logging                                             │
│  - Error Handling                                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ▼               ▼               ▼
   Database        BullMQ           Sentry
   (Postgres)     (Redis)      (Monitoring)
       │               │               │
       │               ▼               │
       │          Workers              │
       │       - Scoring               │
       │       - Emails                │
       │       - Exports               │
       │       - AI Tasks              │
       └───────────────┴───────────────┘
```

---

## Production Checklist

- [ ] Run migrations
- [ ] Install all packages
- [ ] Setup Redis (Upstash or local)
- [ ] Configure Sentry
- [ ] Setup Resend for emails
- [ ] Add environment variables
- [ ] Configure security headers
- [ ] Setup rate limiting
- [ ] Enable audit logging
- [ ] Start background workers
- [ ] Setup cron jobs
- [ ] Test all features
- [ ] Monitor error rates
- [ ] Review security events
- [ ] Check queue metrics

---

## Cost Estimate

### Development (Local)
- Redis: Free (local)
- Sentry: Free tier (5k errors/month)
- Resend: Free tier (100 emails/day)
- **Total: $0/month**

### Production (Small - 1K users)
- Redis (Upstash): $10/month
- Sentry Pro: $26/month
- Resend Pro: $20/month (50k emails)
- **Total: ~$56/month**

### Production (Medium - 10K users)
- Redis: $30/month
- Sentry Business: $80/month
- Resend: $80/month
- **Total: ~$190/month**

---

## Support & Resources

- **Sentry Docs**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **BullMQ Docs**: https://docs.bullmq.io/
- **Resend Docs**: https://resend.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Zod Docs**: https://zod.dev/

---

**Ready for production! 🚀**
