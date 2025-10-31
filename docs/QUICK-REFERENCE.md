# Infrastructure Quick Reference

## 🚀 Quick Start (5 Commands)

```powershell
# 1. Migrate database (adds 11 models)
npx prisma migrate dev --name infrastructure_security_monitoring

# 2. Generate Prisma Client
npx prisma generate

# 3. Install core packages
npm install @sentry/nextjs bullmq ioredis zod resend

# 4. Setup Redis (choose one)
# Local: choco install redis-64 && redis-server
# Cloud: Use Upstash (free tier)

# 5. Start everything
npm run dev
```

---

## 📋 Model Reference

| Model | Use Case | Key Method |
|-------|----------|------------|
| **AuditLog** | Track all user actions | `createAuditLog(action, context, details)` |
| **ErrorLog** | Log errors to database | `logger.error(message, context)` |
| **Job** | Background task tracking | `addJob(queue, name, data)` |
| **RateLimitLog** | Rate limit enforcement | `checkRateLimit(id, type, endpoint, config)` |
| **SecurityEvent** | Security incident logging | `detectSuspiciousActivity(userId, ip, action)` |
| **CacheEntry** | Database-backed cache | Direct Prisma access |

---

## 🔧 Common Operations

### Audit Logging
```typescript
import { createAuditLog, getClientIP, getUserAgent } from '@/lib/monitoring/audit'

await createAuditLog(
  'QUESTION_CREATE',
  {
    userId: session.user.id,
    userEmail: session.user.email,
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
  },
  {
    resource: 'Question',
    resourceId: question.id,
    changes: { before: null, after: question },
  },
  'SUCCESS'
)
```

### Error Logging
```typescript
import { logger } from '@/lib/monitoring/logger'

logger.error('Database connection failed', {
  userId: 'user-123',
  path: '/api/tests',
  error: error.message,
})
```

### Background Jobs
```typescript
import { addJob } from '@/lib/queue'

// Score a test
await addJob('scoring', 'score-test', {
  testAttemptId: 'attempt-123',
  userId: 'user-456',
})

// Send email
await addJob('emails', 'send-email', {
  to: 'user@example.com',
  subject: 'Test Completed',
  template: 'test-completed',
  data: { score: 85 },
})

// Generate PDF export
await addJob('exports', 'export-pdf', {
  userId: 'user-123',
  testAttemptId: 'attempt-456',
  includeAnalytics: true,
})
```

### Rate Limiting
```typescript
import { checkRateLimit, RATE_LIMITS } from '@/lib/security'

const result = await checkRateLimit(
  userIp,
  'ip',
  '/api/ai/chat',
  RATE_LIMITS.ai
)

if (!result.allowed) {
  return Response.json(
    { error: 'Rate limit exceeded' },
    { status: 429 }
  )
}
```

### Input Validation
```typescript
import { questionSchema, validateSchema, formatZodErrors } from '@/lib/validation/schemas'

const validation = validateSchema(questionSchema, body)

if (!validation.success) {
  return Response.json(
    { errors: formatZodErrors(validation.errors) },
    { status: 400 }
  )
}

const validData = validation.data
```

---

## 🎯 Queue Types & Jobs

| Queue | Job Types | Concurrency |
|-------|-----------|-------------|
| **scoring** | SCORE_TEST, GENERATE_RANK | 5 |
| **emails** | SEND_EMAIL, SEND_REMINDER | 10 |
| **exports** | EXPORT_PDF, EXPORT_CSV | 3 |
| **ai** | AI_GENERATE_QUESTIONS, AI_EVALUATE | 2 |
| **indexing** | INDEX_QUESTION, INDEX_TEST | 20 |

---

## 🔐 Rate Limit Configs

| Endpoint Type | Window | Max Requests |
|---------------|--------|--------------|
| **api** | 15 min | 100 |
| **auth** | 15 min | 5 |
| **ai** | 1 hour | 50 |
| **export** | 1 hour | 10 |
| **search** | 1 min | 30 |

---

## 📊 Monitoring Endpoints

### Check Queue Metrics
```typescript
import { getQueueMetrics } from '@/lib/queue'

const metrics = await getQueueMetrics('scoring')
// { waiting: 5, active: 2, completed: 100, failed: 3 }
```

### Get Audit Logs
```typescript
import { getAuditLogs } from '@/lib/monitoring/audit'

const { logs, total } = await getAuditLogs({
  userId: 'user-123',
  action: 'QUESTION_CREATE',
  startDate: new Date('2025-01-01'),
  limit: 50,
})
```

### Track Metrics
```typescript
import { trackMetric } from '@/lib/monitoring/logger'

await trackMetric('api.response_time', 250, {
  unit: 'ms',
  endpoint: '/api/tests',
})
```

---

## 🛡️ Security Utilities

```typescript
import {
  sanitizeInput,
  escapeHTML,
  validateFileUpload,
  detectSuspiciousActivity,
} from '@/lib/security'

// Sanitize user input
const clean = sanitizeInput(userInput)

// Prevent XSS
const safe = escapeHTML(userContent)

// Validate uploads
const { valid, error } = validateFileUpload(file, {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png'],
  allowedExtensions: ['jpg', 'jpeg', 'png'],
})

// Check for suspicious activity
const isSuspicious = await detectSuspiciousActivity(
  userId,
  ipAddress,
  'QUESTION_CREATE'
)
```

---

## 📧 Email Sending

```typescript
// Add to queue (recommended for async)
await addJob('emails', 'send-email', {
  to: 'user@example.com',
  subject: 'Welcome to ExamMaster Pro',
  template: 'welcome',
  data: { name: 'John Doe' },
})

// Or use Resend directly (for critical emails)
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
await resend.emails.send({
  from: process.env.EMAIL_FROM,
  to: 'user@example.com',
  subject: 'Password Reset',
  react: PasswordResetEmail({ token }),
})
```

---

## 🧹 Cleanup Tasks

```typescript
// lib/cron/cleanup.ts
import { prisma } from '@/lib/prisma'
import { cleanQueue } from '@/lib/queue'

// Clean old logs (30 days)
await prisma.errorLog.deleteMany({
  where: {
    createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  },
})

// Clean completed jobs (7 days)
await cleanQueue('default', {
  status: 'completed',
  grace: 7 * 24 * 60 * 60 * 1000,
})
```

---

## 🔍 Debugging

### View Queue Jobs
```powershell
# In Redis CLI
redis-cli
> KEYS bull:*
> HGETALL bull:scoring:job:1
```

### Check Database
```powershell
npx prisma studio
# Browse AuditLog, ErrorLog, Job tables
```

### Monitor Errors (Sentry)
```
https://sentry.io/organizations/your-org/issues/
```

---

## ⚡ Performance Tips

1. **Use background jobs** for heavy operations (scoring, exports, emails)
2. **Cache frequently accessed data** using CacheEntry model
3. **Implement pagination** on audit logs (use limit/offset)
4. **Clean old data regularly** with cron jobs
5. **Monitor queue lengths** - if growing, scale workers
6. **Use Redis for session storage** (faster than database)

---

## 🚨 Common Issues

### Issue: Rate limit not working
**Solution**: Check middleware is configured in `middleware.ts`

### Issue: Jobs stuck in queue
**Solution**: Ensure workers are running (`npx tsx worker.ts`)

### Issue: TypeScript errors
**Solution**: Run `npx prisma generate` after migration

### Issue: Redis connection failed
**Solution**: Check `REDIS_URL` in .env and Redis is running

### Issue: Emails not sending
**Solution**: Verify `RESEND_API_KEY` and email domain verified

---

## 📱 Environment Variables (Minimal)

```env
# Database (Required)
DATABASE_URL="postgresql://..."

# Redis (Required for jobs)
REDIS_URL="redis://localhost:6379"

# Monitoring (Recommended)
NEXT_PUBLIC_SENTRY_DSN="https://..."

# Email (Recommended)
RESEND_API_KEY="re_..."

# Security (Optional but recommended)
RATE_LIMIT_ENABLED="true"
ENABLE_AUDIT_LOGS="true"
```

---

## 🎓 Learning Path

1. **Day 1**: Run migration, install packages, setup Redis
2. **Day 2**: Implement audit logging in one API route
3. **Day 3**: Add background job for test scoring
4. **Day 4**: Setup Sentry and test error tracking
5. **Day 5**: Implement rate limiting middleware
6. **Day 6**: Add input validation with Zod
7. **Day 7**: Setup email service and templates

---

## 📞 Quick Links

- **Docs**: `/docs/INFRASTRUCTURE-SETUP.md`
- **Summary**: `/docs/INFRASTRUCTURE-SUMMARY.md`
- **Schema**: `/prisma/schema.prisma`
- **Sentry**: https://sentry.io
- **BullMQ**: https://docs.bullmq.io
- **Resend**: https://resend.com/docs

---

**Ready to go production! 🚀**
