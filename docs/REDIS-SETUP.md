# 🔧 Redis Configuration Guide

## Quick Setup (5 minutes)

### Step 1: Create Upstash Account
1. Go to https://upstash.com
2. Click **"Sign Up"** (or use GitHub/Google login)
3. Verify your email if required

### Step 2: Create Redis Database
1. In Upstash dashboard, click **"Create Database"**
2. Configure:
   - **Name**: `exammaster-redis`
   - **Type**: Select **"Regional"**
   - **Region**: Choose closest to you:
     - `ap-southeast-1` (Singapore) - for Asia
     - `us-east-1` (N. Virginia) - for Americas
     - `eu-west-1` (Ireland) - for Europe
   - **TLS**: Keep **enabled** ✓
   - **Eviction**: Keep default
3. Click **"Create"** button

### Step 3: Get Connection URL
1. Click on your newly created database
2. Scroll down to **"REST API"** section
3. You'll see three important values:
   ```
   UPSTASH_REDIS_REST_URL
   UPSTASH_REDIS_REST_TOKEN
   ```
4. Also find the **"Redis URL"** at the top (looks like):
   ```
   rediss://default:AbCd1234XyZ...@app-region-12345.upstash.io:6379
   ```

### Step 4: Update .env File
1. Open your `.env` file
2. Find the Redis section
3. Replace the placeholder values:
   ```env
   # From Upstash dashboard
   REDIS_URL="rediss://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379"
   UPSTASH_REDIS_REST_URL="https://YOUR_HOST.upstash.io"
   UPSTASH_REDIS_REST_TOKEN="YOUR_TOKEN"
   ```

### Step 5: Test Connection
Run the test script:
```bash
npx tsx scripts/test-redis.ts
```

Expected output:
```
✅ Redis connection test successful!

📊 Redis is ready for:
  - Background job queues (BullMQ)
  - Rate limiting
  - Session caching
  - API response caching
```

---

## Alternative: Local Redis (Development Only)

If you prefer running Redis locally:

### Windows (PowerShell)
```powershell
# Install via Chocolatey
choco install redis-64

# Start Redis
redis-server

# In another terminal, test
redis-cli ping
# Should return: PONG
```

### macOS
```bash
# Install via Homebrew
brew install redis

# Start Redis
brew services start redis

# Test
redis-cli ping
```

### Linux (Ubuntu/Debian)
```bash
# Install
sudo apt-get update
sudo apt-get install redis-server

# Start
sudo systemctl start redis-server

# Test
redis-cli ping
```

### Update .env for Local Redis
```env
REDIS_URL="redis://localhost:6379"
```

---

## What Redis is Used For

### 1. Background Job Queues (BullMQ)
- **Scoring Worker**: Auto-calculate test scores
- **Email Worker**: Send transactional emails
- **Export Worker**: Generate PDF/CSV reports
- **AI Worker**: Process AI tasks (hints, generation, evaluation)
- **Indexing Worker**: Sync to Meilisearch

### 2. Rate Limiting
- Prevent DDoS attacks
- API endpoint protection
- User-based rate limits

### 3. Caching
- API response caching
- Session data caching
- Frequently accessed data

### 4. Real-time Features
- Job progress tracking
- Live notifications
- Queue monitoring

---

## Free Tier Limits (Upstash)

- **Daily Commands**: 10,000
- **Max Data Size**: 256 MB
- **Max Connections**: 100
- **Max Request Size**: 1 MB

**This is more than enough for development and small production apps!**

---

## Troubleshooting

### Error: ECONNREFUSED
**Problem**: Cannot connect to Redis
**Solution**:
1. Check if REDIS_URL is correct in .env
2. Make sure Redis database is created in Upstash
3. Verify internet connection

### Error: WRONGPASS
**Problem**: Authentication failed
**Solution**:
1. Copy the REDIS_URL again from Upstash
2. Make sure you copied the entire URL including password
3. Check for extra spaces or quotes

### Error: Timeout
**Problem**: Connection timeout
**Solution**:
1. Check if your firewall allows outbound connections to port 6379
2. Try a different region in Upstash
3. Check if your network blocks Redis connections

---

## Testing Background Jobs

Once Redis is configured, you can test background jobs:

```typescript
import { addJob, getJobStatus } from '@/lib/queue'

// Add a scoring job
const jobId = await addJob('scoring', 'score-test', {
  testAttemptId: 'attempt-123',
  userId: 'user-456'
})

// Check job status
const status = await getJobStatus(jobId)
console.log(status) // { status: 'completed', result: {...} }
```

---

## Production Recommendations

For production with higher traffic:

### Upstash Pro Plan (~$10-30/month)
- 100K-1M daily commands
- Better performance
- Dedicated resources
- Email support

### Redis Cloud (alternative)
- Multiple providers (Redis Labs, AWS ElastiCache, etc.)
- More control over configuration
- Higher costs but enterprise features

---

## Next Steps

1. ✅ Create Upstash account
2. ✅ Create Redis database
3. ✅ Update .env with connection URL
4. ✅ Run test script: `npx tsx scripts/test-redis.ts`
5. 🚀 Start using background jobs!

---

## Quick Commands

```bash
# Test Redis connection
npx tsx scripts/test-redis.ts

# Start dev server (workers will auto-start)
npm run dev

# Monitor Redis (if running locally)
redis-cli monitor

# Check Redis info
redis-cli info server
```

---

**Need Help?** Check the Upstash docs: https://upstash.com/docs/redis/overall/getstarted
