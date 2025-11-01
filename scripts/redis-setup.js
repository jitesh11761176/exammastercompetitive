#!/usr/bin/env node

console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║              🔧 REDIS SETUP - QUICK START GUIDE 🔧               ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝

Redis is required for:
  ✓ Background job queues (BullMQ)
  ✓ Rate limiting
  ✓ Caching
  ✓ Real-time features

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 OPTION 1: UPSTASH CLOUD (RECOMMENDED - FREE)

  Step 1: Create Account
    → Go to: https://upstash.com
    → Click "Sign Up" (use GitHub/Google)

  Step 2: Create Redis Database
    → Click "Create Database"
    → Name: exammaster-redis
    → Type: Regional
    → Region: Choose closest to you
    → Click "Create"

  Step 3: Get Connection Details
    → Click on your database
    → Copy the "Redis URL" (rediss://...)
    → Copy "REST URL" and "REST Token"

  Step 4: Update .env File
    → Open: .env
    → Replace placeholders:
      
      REDIS_URL="rediss://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379"
      UPSTASH_REDIS_REST_URL="https://YOUR_HOST.upstash.io"
      UPSTASH_REDIS_REST_TOKEN="YOUR_TOKEN"

  Step 5: Test Connection
    → Run: npx tsx scripts/test-redis.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 OPTION 2: LOCAL REDIS (DEVELOPMENT ONLY)

  Windows (PowerShell):
    → choco install redis-64
    → redis-server

  macOS:
    → brew install redis
    → brew services start redis

  Linux (Ubuntu/Debian):
    → sudo apt-get install redis-server
    → sudo systemctl start redis-server

  Update .env:
    REDIS_URL="redis://localhost:6379"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 DOCUMENTATION

  → Full Guide: docs/REDIS-SETUP.md
  → Infrastructure: docs/INFRASTRUCTURE-SETUP.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 AFTER SETUP

  Test connection:
    $ npx tsx scripts/test-redis.ts

  Start dev server (workers auto-start):
    $ npm run dev

  Test background jobs:
    → Jobs will be processed automatically
    → Check console for worker logs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 TIP: Upstash free tier gives you 10,000 commands/day
        Perfect for development and small production apps!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
