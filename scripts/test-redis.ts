import Redis from 'ioredis'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testRedis() {
  console.log('🔍 Testing Redis Connection...\n')

  try {
    const redisUrl = process.env.REDIS_URL
    
    if (!redisUrl || redisUrl.includes('YOUR_UPSTASH')) {
      console.log('❌ Redis URL not configured!')
      console.log('\n📋 Steps to configure:')
      console.log('  1. Go to https://upstash.com')
      console.log('  2. Create account (free)')
      console.log('  3. Create new Redis database')
      console.log('  4. Copy the Redis URL from dashboard')
      console.log('  5. Update REDIS_URL in .env file')
      console.log('\nExample:')
      console.log('  REDIS_URL="rediss://default:xxxxx@xxxxx.upstash.io:6379"\n')
      return
    }

    console.log('📡 Connecting to Redis...')
    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
    })

    // Test basic operations
    console.log('✓ Connected to Redis\n')
    
    console.log('🧪 Testing basic operations...')
    
    // 1. Set a value
    await redis.set('test:ping', 'pong', 'EX', 60)
    console.log('  ✓ SET operation successful')
    
    // 2. Get the value
    const value = await redis.get('test:ping')
    console.log(`  ✓ GET operation successful (value: ${value})`)
    
    // 3. Test hash operations
    await redis.hset('test:hash', 'field1', 'value1', 'field2', 'value2')
    const hashValue = await redis.hget('test:hash', 'field1')
    console.log(`  ✓ HASH operations successful (field1: ${hashValue})`)
    
    // 4. Test list operations
    await redis.lpush('test:list', 'item1', 'item2', 'item3')
    const listLength = await redis.llen('test:list')
    console.log(`  ✓ LIST operations successful (length: ${listLength})`)
    
    // 5. Get Redis info
    const info = await redis.info('server')
    const versionMatch = info.match(/redis_version:([^\r\n]+)/)
    if (versionMatch) {
      console.log(`  ✓ Redis version: ${versionMatch[1]}`)
    }
    
    // Clean up
    await redis.del('test:ping', 'test:hash', 'test:list')
    console.log('  ✓ Cleanup completed')
    
    console.log('\n✅ Redis connection test successful!')
    console.log('\n📊 Redis is ready for:')
    console.log('  - Background job queues (BullMQ)')
    console.log('  - Rate limiting')
    console.log('  - Session caching')
    console.log('  - API response caching')
    
    await redis.quit()
    
  } catch (error: any) {
    console.error('\n❌ Redis connection failed!')
    console.error('Error:', error.message)
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Troubleshooting:')
      console.log('  1. Check if REDIS_URL is correct in .env file')
      console.log('  2. Make sure the Redis database is created in Upstash')
      console.log('  3. Verify your internet connection')
      console.log('  4. Check if the region is accessible from your location')
    } else if (error.message.includes('WRONGPASS')) {
      console.log('\n💡 Authentication failed:')
      console.log('  1. Check if the password in REDIS_URL is correct')
      console.log('  2. Copy the URL again from Upstash dashboard')
    }
    
    process.exit(1)
  }
}

testRedis()
