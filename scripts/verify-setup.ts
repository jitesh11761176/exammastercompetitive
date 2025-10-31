import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifySetup() {
  console.log('🔍 Verifying ExamMaster Pro Setup...\n')

  let passed = 0
  let failed = 0

  // Test 1: Database Connection
  try {
    await prisma.$connect()
    console.log('✅ Database connection successful')
    passed++
  } catch (error) {
    console.log('❌ Database connection failed')
    console.error(error)
    failed++
  }

  // Test 2: Check AI Tables Exist
  try {
    await prisma.chatSession.findMany({ take: 1 })
    await prisma.chatMessage.findMany({ take: 1 })
    await prisma.aIHint.findMany({ take: 1 })
    await prisma.aIGeneratedQuestion.findMany({ take: 1 })
    await prisma.subjectiveEvaluation.findMany({ take: 1 })
    console.log('✅ AI tables exist (ChatSession, ChatMessage, AIHint, etc.)')
    passed++
  } catch (error) {
    console.log('❌ AI tables missing - Run migration: npx prisma migrate dev')
    failed++
  }

  // Test 3: Check Recommendation Tables
  try {
    await prisma.userRecommendation.findMany({ take: 1 })
    await prisma.userInteraction.findMany({ take: 1 })
    console.log('✅ Recommendation tables exist (UserRecommendation, UserInteraction)')
    passed++
  } catch (error) {
    console.log('❌ Recommendation tables missing')
    failed++
  }

  // Test 4: Check Search Tables
  try {
    await prisma.searchIndex.findMany({ take: 1 })
    console.log('✅ Search tables exist (SearchIndex)')
    passed++
  } catch (error) {
    console.log('❌ Search tables missing')
    failed++
  }

  // Test 5: Check Mobile/PWA Tables
  try {
    await prisma.pushSubscription.findMany({ take: 1 })
    await prisma.notification.findMany({ take: 1 })
    await prisma.offlineQueue.findMany({ take: 1 })
    console.log('✅ Mobile/PWA tables exist (PushSubscription, Notification, OfflineQueue)')
    passed++
  } catch (error) {
    console.log('❌ Mobile/PWA tables missing')
    failed++
  }

  // Test 6: Check Comprehensive Features Tables
  try {
    await prisma.testSection.findMany({ take: 1 })
    await prisma.subscription.findMany({ take: 1 })
    await prisma.payment.findMany({ take: 1 })
    await prisma.dailyChallenge.findMany({ take: 1 })
    console.log('✅ Comprehensive feature tables exist (TestSection, Subscription, Payment, DailyChallenge)')
    passed++
  } catch (error) {
    console.log('❌ Some comprehensive feature tables missing')
    failed++
  }

  // Test 7: OpenAI Configuration
  if (process.env.OPENAI_API_KEY) {
    console.log('✅ OPENAI_API_KEY configured')
    passed++
  } else {
    console.log('❌ OPENAI_API_KEY not set in .env')
    failed++
  }

  // Test 8: Meilisearch Configuration
  if (process.env.MEILISEARCH_HOST && process.env.MEILISEARCH_API_KEY) {
    console.log('✅ Meilisearch configured')
    passed++
  } else {
    console.log('❌ Meilisearch not configured in .env')
    failed++
  }

  // Test 9: VAPID Keys for Push Notifications
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    console.log('✅ VAPID keys configured')
    passed++
  } else {
    console.log('❌ VAPID keys not set - Run: npx @web-push/vapid generate')
    failed++
  }

  // Test 10: Check for Sample Data
  try {
    const userCount = await prisma.user.count()
    const questionCount = await prisma.question.count()
    const testCount = await prisma.test.count()
    
    console.log(`\n📊 Database Statistics:`)
    console.log(`   Users: ${userCount}`)
    console.log(`   Questions: ${questionCount}`)
    console.log(`   Tests: ${testCount}`)
    
    if (userCount > 0 && questionCount > 0 && testCount > 0) {
      console.log('✅ Database has sample data')
      passed++
    } else {
      console.log('⚠️  Database is empty - Consider adding sample data')
    }
  } catch (error) {
    console.log('⚠️  Could not check database statistics')
  }

  // Summary
  console.log(`\n${'='.repeat(50)}`)
  console.log(`📈 Setup Verification Complete`)
  console.log(`${'='.repeat(50)}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`${'='.repeat(50)}\n`)

  if (failed === 0) {
    console.log('🎉 All checks passed! Your setup is complete.')
    console.log('\n📝 Next Steps:')
    console.log('   1. Start dev server: npm run dev')
    console.log('   2. Initialize search: npx tsx scripts/init-search.ts')
    console.log('   3. Start building UI components (see docs/IMPLEMENTATION-CHECKLIST.md)')
  } else {
    console.log('⚠️  Some checks failed. Please fix the issues above.')
    console.log('\n🔧 Common Fixes:')
    console.log('   - Run migration: npx prisma migrate dev')
    console.log('   - Install packages: npm install openai meilisearch web-push')
    console.log('   - Configure .env (see docs/AI-SETUP-GUIDE.md)')
  }

  await prisma.$disconnect()
}

verifySetup().catch(console.error)
