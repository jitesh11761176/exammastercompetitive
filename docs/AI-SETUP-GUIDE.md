# AI & Advanced Features Setup Guide

## Overview
This guide covers setting up the AI-powered features, recommendation engine, search, and mobile PWA capabilities.

## Prerequisites
- Neon PostgreSQL database configured
- Node.js and npm installed
- OpenAI API account
- Meilisearch (local or cloud)

---

## Step 1: Run Database Migration

First, apply all schema changes (comprehensive features + AI features):

```powershell
npx prisma migrate dev --name comprehensive_ai_features
npx prisma generate
```

This will create 40+ tables including:
- AI Features: ChatSession, ChatMessage, AIHint, AIGeneratedQuestion, SubjectiveEvaluation, DocumentUpload
- Recommendations: UserRecommendation, UserInteraction
- Search: SearchIndex
- Mobile/PWA: PushSubscription, OfflineQueue, Notification
- Test Engine: Enhanced Question with 7 types, TestSection, etc.
- Payments: Subscription, Payment, Coupon
- Study: DailyChallenge, StudyGoal, StudySession, Streak
- Analytics: Enhanced analytics tables

---

## Step 2: Install Required Packages

Install all necessary npm packages:

```powershell
# AI Integration
npm install openai

# Search Integration
npm install meilisearch

# Web Push Notifications
npm install web-push
npm install @web-push/vapid

# Optional: For better date handling in recommendations
npm install date-fns
```

---

## Step 3: Setup Meilisearch

### Option A: Local Installation (Recommended for development)

1. Download Meilisearch:
   ```powershell
   # Download for Windows
   Invoke-WebRequest -Uri "https://github.com/meilisearch/meilisearch/releases/latest/download/meilisearch-windows-amd64.exe" -OutFile "meilisearch.exe"
   ```

2. Run Meilisearch:
   ```powershell
   .\meilisearch.exe --master-key="YOUR_MASTER_KEY_HERE"
   ```
   
   Meilisearch will start on http://localhost:7700

### Option B: Cloud Hosting (Recommended for production)

1. Sign up at https://www.meilisearch.com/cloud
2. Create a new project
3. Get your API keys from the dashboard

---

## Step 4: Generate VAPID Keys (for Push Notifications)

```powershell
npx @web-push/vapid generate
```

This will output:
```
Public Key: BG...
Private Key: AB...
```

Save these for the next step.

---

## Step 5: Configure Environment Variables

Add to your `.env` file:

```env
# ===== AI Configuration =====
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
# Use gpt-4o-mini for cost-effective AI features
# Use gpt-4o for better quality (more expensive)

# ===== Meilisearch Configuration =====
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=YOUR_MASTER_KEY_HERE
# For cloud: Use the provided URL and API key from Meilisearch Cloud

# ===== Web Push Configuration =====
VAPID_PUBLIC_KEY=BG...
VAPID_PRIVATE_KEY=AB...
VAPID_SUBJECT=mailto:admin@exammaster.com
# Replace with your actual admin email

# ===== Existing Configuration =====
# DATABASE_URL=... (already set)
# NEXTAUTH_SECRET=... (already set)
# NEXTAUTH_URL=... (already set)
```

---

## Step 6: Initialize Search Indexes

Create a script to initialize Meilisearch indexes:

```powershell
# Create a Node script file
New-Item -Path "scripts/init-search.ts" -ItemType File -Force
```

Add this content to `scripts/init-search.ts`:

```typescript
import { initializeSearchIndexes } from '../lib/search/meilisearch-client'
import { syncQuestionsToSearchIndex, syncTestsToSearchIndex } from '../lib/search/indexing'

async function init() {
  try {
    console.log('Initializing search indexes...')
    await initializeSearchIndexes()
    
    console.log('Syncing questions to search...')
    const questionsCount = await syncQuestionsToSearchIndex()
    
    console.log('Syncing tests to search...')
    const testsCount = await syncTestsToSearchIndex()
    
    console.log(`✅ Search setup complete! Indexed ${questionsCount} questions and ${testsCount} tests.`)
  } catch (error) {
    console.error('❌ Search initialization failed:', error)
    process.exit(1)
  }
}

init()
```

Run it:
```powershell
npx tsx scripts/init-search.ts
```

---

## Step 7: Test AI Features

### Test Chat API

```powershell
# Start dev server
npm run dev
```

Test with curl or Postman:

```bash
# Create a chat session
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I don't understand how quadratic equations work",
    "questionId": "OPTIONAL_QUESTION_ID"
  }'
```

Expected response:
```json
{
  "sessionId": "...",
  "message": {
    "id": "...",
    "content": "Let me explain quadratic equations...",
    "role": "ASSISTANT",
    "ragSources": ["question-1", "question-2"]
  }
}
```

---

## Step 8: Verify Setup

### Check Database
```powershell
npx prisma studio
```

Verify these tables exist:
- ✅ ChatSession, ChatMessage
- ✅ AIHint, AIGeneratedQuestion
- ✅ SubjectiveEvaluation
- ✅ UserRecommendation, UserInteraction
- ✅ SearchIndex
- ✅ PushSubscription, Notification

### Check Meilisearch
Visit http://localhost:7700 (or your cloud URL)
- Should show 2 indexes: `questions` and `tests`

### Check OpenAI Integration
Create a test file:

```typescript
// test-ai.ts
import { generateChatResponse } from './lib/ai/openai-client'

async function test() {
  const response = await generateChatResponse(
    'Explain Newton\'s laws of motion',
    'You are a helpful physics tutor.',
    []
  )
  console.log(response)
}

test()
```

Run: `npx tsx test-ai.ts`

---

## Step 9: Feature Activation Checklist

### ✅ AI Chat with RAG
- [x] Schema migrated (ChatSession, ChatMessage)
- [x] API created (`/api/ai/chat`)
- [x] OpenAI client configured
- [x] RAG context system ready
- [ ] **TODO: Build chat UI component**

### ✅ Recommendation Engine
- [x] Schema migrated (UserRecommendation, UserInteraction)
- [x] API created (`/api/recommendations`)
- [x] Spaced repetition algorithm (SM-2)
- [x] Next best test logic
- [x] Weak topic detection
- [ ] **TODO: Build recommendation cards UI**

### ✅ Search Integration
- [x] Meilisearch client configured
- [x] Indexing utilities created
- [x] API created (`/api/search`)
- [ ] **TODO: Build instant search UI component**
- [ ] **TODO: Setup cron job for auto-sync**

### ⏳ AI Hints (Pending UI)
- [x] Schema ready (AIHint)
- [x] OpenAI function (generateHints)
- [ ] **TODO: Create hints API**
- [ ] **TODO: Build progressive hints UI**

### ⏳ AI Question Generation (Pending UI)
- [x] Schema ready (AIGeneratedQuestion)
- [x] OpenAI function (generateQuestions)
- [ ] **TODO: Create generation API**
- [ ] **TODO: Build admin interface**

### ⏳ Subjective Evaluation (Pending UI)
- [x] Schema ready (SubjectiveEvaluation)
- [x] OpenAI function (evaluateSubjectiveAnswer)
- [ ] **TODO: Create evaluation API**
- [ ] **TODO: Build grading review UI**

### ⏳ Document Upload & AI Extraction (Pending)
- [x] Schema ready (DocumentUpload)
- [ ] **TODO: Add OCR library (Tesseract.js or Azure Computer Vision)**
- [ ] **TODO: Create upload API**
- [ ] **TODO: Build upload UI**

### ⏳ PWA & Push Notifications (Pending)
- [x] Schema ready (PushSubscription, OfflineQueue, Notification)
- [x] VAPID keys generated
- [ ] **TODO: Create service worker**
- [ ] **TODO: Setup push API**
- [ ] **TODO: Build install prompt**

---

## Step 10: Next Steps

### High Priority (Build This Week)

1. **AI Chat UI** (`app/(dashboard)/chat/page.tsx`)
   - Chat interface with message bubbles
   - Show RAG sources
   - Link to questions
   - Real-time typing indicator

2. **Search Bar Component** (`components/search/InstantSearch.tsx`)
   - Global search in header
   - Instant results dropdown
   - Filter by type (questions/tests)
   - Keyboard navigation

3. **Recommendation Cards** (`components/recommendations/RecommendationCard.tsx`)
   - Show on dashboard
   - Display next best test
   - Show weak topics to practice
   - Spaced repetition reminders

### Medium Priority (Next 2 Weeks)

4. **AI Hints System**
   - API: `/api/hints/[questionId]`
   - Component: `HintButton.tsx`
   - 3-level progressive hints
   - Track score reduction

5. **AI Question Generator** (Admin only)
   - API: `/api/admin/ai/generate-questions`
   - Page: `app/admin/ai/generate/page.tsx`
   - Bulk generation from prompts
   - Review and approve workflow

6. **Service Worker & PWA**
   - Create `public/sw.js`
   - Cache strategy for offline tests
   - Background sync for submissions
   - Install prompt

### Low Priority (Future)

7. **Document Upload with AI Extraction**
   - Upload PDF exam papers
   - OCR to extract text
   - AI to parse questions
   - Auto-create questions in DB

8. **Push Notifications**
   - Subscribe API
   - Send API
   - Notification types (reminders, challenges, achievements)

---

## Troubleshooting

### Meilisearch Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:7700
```
**Solution**: Make sure Meilisearch is running. Start it with:
```powershell
.\meilisearch.exe --master-key="YOUR_KEY"
```

### OpenAI Rate Limit Error
```
Error: Rate limit exceeded
```
**Solution**: 
- Use `gpt-4o-mini` instead of `gpt-4o` (cheaper)
- Add exponential backoff retry logic
- Check your OpenAI usage limits

### TypeScript Errors
```
Property 'chatSession' does not exist
```
**Solution**: Make sure you ran:
```powershell
npx prisma generate
```

### Migration Fails
```
Error: relation "Question" does not exist
```
**Solution**: Drop all tables and re-run migration (⚠️ WARNING: Data loss)
```powershell
npx prisma migrate reset
npx prisma migrate dev
```

---

## Performance Optimization

### Database Indexes (Already in Schema)
- ✅ ChatSession: userId, questionId
- ✅ UserRecommendation: userId, nextReviewDate
- ✅ SearchIndex: itemId + itemType composite
- ✅ UserInteraction: userId, itemId

### Meilisearch Optimization
- Index only active questions and tests
- Use filters for category/difficulty
- Set up cron job to sync every hour

### Caching Strategy
- Cache search results for 5 minutes
- Cache recommendations for 1 hour
- Use Redis for hot data (optional)

---

## Monitoring & Analytics

### Track AI Usage
```typescript
// Log AI calls to analytics
await prisma.analytics.update({
  where: { userId },
  data: {
    aiCallsCount: { increment: 1 },
    aiTokensUsed: { increment: tokensUsed }
  }
})
```

### Monitor Search Performance
- Track search latency in Meilisearch dashboard
- Monitor index size
- Check search-to-click ratio

### Recommendation Effectiveness
- Track recommendation click-through rate
- Measure accuracy improvement after following recommendations
- A/B test different recommendation algorithms

---

## Cost Estimation

### OpenAI Costs (gpt-4o-mini)
- Input: $0.150 / 1M tokens
- Output: $0.600 / 1M tokens
- Estimated: $5-20/month for 1000 active users

### Meilisearch Cloud
- Free: Up to 100k documents
- Pro: $29/month (1M documents)
- Enterprise: Custom pricing

### Total Estimated Cost
- Development: $0-10/month (local setup)
- Production (1000 users): $30-50/month
- Production (10k users): $100-200/month

---

## Security Best Practices

1. **API Key Protection**
   - Never commit `.env` to git
   - Use environment variables in production
   - Rotate OpenAI keys monthly

2. **Rate Limiting**
   - Add rate limits to AI endpoints (10 requests/min per user)
   - Implement token usage caps
   - Monitor for abuse

3. **Data Privacy**
   - Don't send user PII to OpenAI
   - Anonymize chat logs
   - GDPR compliance for EU users

4. **Content Moderation**
   - Use OpenAI moderation API for chat
   - Filter inappropriate questions
   - Human review for generated content

---

## Support

### Documentation
- OpenAI API: https://platform.openai.com/docs
- Meilisearch Docs: https://www.meilisearch.com/docs
- Web Push API: https://web.dev/push-notifications-overview/

### Need Help?
- Check TypeScript errors with `npm run type-check`
- View logs: `npm run dev` shows detailed errors
- Test APIs: Use Postman or curl
- Database issues: `npx prisma studio`

---

## Quick Reference Commands

```powershell
# Development
npm run dev                          # Start dev server
npx prisma studio                    # Open database GUI
npx prisma migrate dev               # Run migrations
npx prisma generate                  # Regenerate Prisma Client

# Search
.\meilisearch.exe --master-key="KEY" # Start Meilisearch
npx tsx scripts/init-search.ts       # Initialize search indexes

# Testing
npm run test                         # Run tests (if configured)
npm run type-check                   # Check TypeScript errors

# Production
npm run build                        # Build for production
npm start                            # Start production server
```

---

## Success Criteria

Your setup is complete when:

✅ Dev server starts without errors
✅ Prisma Studio shows all 40+ tables
✅ Meilisearch shows 2 indexes with data
✅ Chat API returns AI responses
✅ Search API returns relevant results
✅ Recommendations API returns suggestions
✅ No TypeScript compilation errors

**Next**: Start building the UI components!
