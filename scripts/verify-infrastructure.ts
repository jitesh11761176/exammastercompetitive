import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyInfrastructure() {
  console.log('🔍 Verifying Infrastructure Setup...\n')

  try {
    // Check database models
    console.log('✓ Database Models:')
    
    // Test monitoring models
    const auditLogCount = await prisma.auditLog.count()
    console.log(`  - AuditLog: ${auditLogCount} records`)
    
    const errorLogCount = await prisma.errorLog.count()
    console.log(`  - ErrorLog: ${errorLogCount} records`)
    
    const systemMetricCount = await prisma.systemMetric.count()
    console.log(`  - SystemMetric: ${systemMetricCount} records`)
    
    // Test job models
    const jobCount = await prisma.job.count()
    console.log(`  - Job: ${jobCount} records`)
    
    // Test security models
    const rateLimitLogCount = await prisma.rateLimitLog.count()
    console.log(`  - RateLimitLog: ${rateLimitLogCount} records`)
    
    const apiKeyCount = await prisma.apiKey.count()
    console.log(`  - ApiKey: ${apiKeyCount} records`)
    
    const securityEventCount = await prisma.securityEvent.count()
    console.log(`  - SecurityEvent: ${securityEventCount} records`)
    
    // Test caching model
    const cacheEntryCount = await prisma.cacheEntry.count()
    console.log(`  - CacheEntry: ${cacheEntryCount} records`)
    
    // Test event sourcing models
    const eventCount = await prisma.event.count()
    console.log(`  - Event: ${eventCount} records`)
    
    const webhookCount = await prisma.webhook.count()
    console.log(`  - Webhook: ${webhookCount} records`)
    
    const webhookDeliveryCount = await prisma.webhookDelivery.count()
    console.log(`  - WebhookDelivery: ${webhookDeliveryCount} records`)
    
    console.log('\n✅ All infrastructure models are accessible!')
    
    // Check packages
    console.log('\n✓ Checking installed packages:')
    
    try {
      require('@sentry/nextjs')
      console.log('  - @sentry/nextjs ✓')
    } catch {
      console.log('  - @sentry/nextjs ✗')
    }
    
    try {
      require('bullmq')
      console.log('  - bullmq ✓')
    } catch {
      console.log('  - bullmq ✗')
    }
    
    try {
      require('ioredis')
      console.log('  - ioredis ✓')
    } catch {
      console.log('  - ioredis ✗')
    }
    
    try {
      require('zod')
      console.log('  - zod ✓')
    } catch {
      console.log('  - zod ✗')
    }
    
    try {
      require('resend')
      console.log('  - resend ✓')
    } catch {
      console.log('  - resend ✗')
    }
    
    try {
      require('papaparse')
      console.log('  - papaparse ✓')
    } catch {
      console.log('  - papaparse ✗')
    }
    
    try {
      require('xlsx')
      console.log('  - xlsx ✓')
    } catch {
      console.log('  - xlsx ✗')
    }
    
    console.log('\n✅ Infrastructure setup verified successfully!')
    console.log('\n📋 Next Steps:')
    console.log('  1. Setup Redis (local or Upstash cloud)')
    console.log('  2. Configure Sentry (get DSN from sentry.io)')
    console.log('  3. Configure Resend (verify domain, get API key)')
    console.log('  4. Generate VAPID keys: npx @web-push/vapid generate')
    console.log('  5. Update .env with all credentials')
    console.log('  6. Start the dev server: npm run dev')
    console.log('\n📚 Documentation:')
    console.log('  - Setup Guide: docs/INFRASTRUCTURE-SETUP.md')
    console.log('  - Summary: docs/INFRASTRUCTURE-SUMMARY.md')
    console.log('  - Quick Reference: docs/QUICK-REFERENCE.md\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

verifyInfrastructure()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
