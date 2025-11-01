import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '../monitoring/logger'
import { getClientIP } from '../monitoring/audit'

// Rate limit configurations
export const RATE_LIMITS = {
  // API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
  },
  
  // Authentication
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 login attempts per 15 minutes
  },
  
  // AI endpoints
  ai: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 AI requests per hour
  },
  
  // Heavy operations
  export: {
    windowMs: 60 * 60 * 1000,
    max: 10, // 10 exports per hour
  },
  
  // Search
  search: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
  },
}

// Check rate limit
export async function checkRateLimit(
  identifier: string,
  identifierType: 'user' | 'ip' | 'api_key',
  endpoint: string,
  config: { windowMs: number; max: number }
): Promise<{
  allowed: boolean
  remaining: number
  resetAt: Date
}> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - config.windowMs)
  // windowEnd is calculated per-entry; no local value needed here
  
  try {
    // Find existing rate limit entry
    const existing = await prisma.rateLimitLog.findFirst({
      where: {
        identifier,
        identifierType,
        endpoint,
        windowStart: {
          gte: windowStart,
        },
      },
      orderBy: {
        windowStart: 'desc',
      },
    })
    
    if (existing && existing.windowEnd > now) {
      // Within existing window
      const updatedHits = existing.hits + 1
      
      if (updatedHits > config.max) {
        // Rate limit exceeded
        await prisma.rateLimitLog.update({
          where: { id: existing.id },
          data: {
            hits: updatedHits,
            blocked: true,
            blockedUntil: existing.windowEnd,
          },
        })
        
        // Log security event
        logger.warn('Rate limit exceeded', {
          identifier,
          endpoint,
          hits: updatedHits,
          limit: config.max,
        })
        
        return {
          allowed: false,
          remaining: 0,
          resetAt: existing.windowEnd,
        }
      }
      
      // Update hits
      await prisma.rateLimitLog.update({
        where: { id: existing.id },
        data: { hits: updatedHits },
      })
      
      return {
        allowed: true,
        remaining: config.max - updatedHits,
        resetAt: existing.windowEnd,
      }
    } else {
      // Create new window
      const newWindowEnd = new Date(now.getTime() + config.windowMs)
      
      await prisma.rateLimitLog.create({
        data: {
          identifier,
          identifierType,
          endpoint,
          method: 'GET', // Will be updated by middleware
          limit: config.max,
          windowMs: config.windowMs,
          hits: 1,
          windowStart: now,
          windowEnd: newWindowEnd,
        },
      })
      
      return {
        allowed: true,
        remaining: config.max - 1,
        resetAt: newWindowEnd,
      }
    }
  } catch (error) {
    logger.error('Rate limit check failed', { error, identifier, endpoint })
    
    // Fail open - allow request if rate limit check fails
    return {
      allowed: true,
      remaining: config.max,
      resetAt: new Date(now.getTime() + config.windowMs),
    }
  }
}

// Rate limit middleware
export function rateLimitMiddleware(
  config: keyof typeof RATE_LIMITS | { windowMs: number; max: number }
) {
  return async (req: NextRequest) => {
    const limitConfig = typeof config === 'string' ? RATE_LIMITS[config] : config
    const ip = getClientIP(req)
    const endpoint = new URL(req.url).pathname
    
    const result = await checkRateLimit(ip, 'ip', endpoint, limitConfig)
    
    if (!result.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limitConfig.max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetAt.toISOString(),
            'Retry-After': Math.ceil(
              (result.resetAt.getTime() - Date.now()) / 1000
            ).toString(),
          },
        }
      )
    }
    
    // Add rate limit headers to response
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', limitConfig.max.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', result.resetAt.toISOString())
    
    return response
  }
}

// CSRF token generation and validation
export function generateCSRFToken(): string {
  return crypto.randomUUID()
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  // Simple validation - in production, use signed tokens
  return token === sessionToken
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
}

// SQL injection prevention (Prisma handles this, but for raw queries)
export function escapeSQLInput(input: string): string {
  return input.replace(/'/g, "''")
}

// XSS prevention
export function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  return text.replace(/[&<>"'/]/g, (char) => map[char])
}

// Validate file upload
export function validateFileUpload(file: File, options: {
  maxSize?: number
  allowedTypes?: string[]
  allowedExtensions?: string[]
}): { valid: boolean; error?: string } {
  // Check file size
  if (options.maxSize && file.size > options.maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${options.maxSize / 1024 / 1024}MB`,
    }
  }
  
  // Check MIME type
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed`,
    }
  }
  
  // Check extension
  if (options.allowedExtensions) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !options.allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `File extension .${ext} not allowed`,
      }
    }
  }
  
  return { valid: true }
}

// Detect suspicious activity
export async function detectSuspiciousActivity(
  userId: string,
  ipAddress: string,
  action: string
): Promise<boolean> {
  try {
    // Check for rapid actions
    const recentActions = await prisma.auditLog.count({
      where: {
        userId,
        action: action as any,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // Last minute
        },
      },
    })
    
    if (recentActions > 10) {
      await logSecurityEvent(userId, ipAddress, 'UNUSUAL_ACTIVITY', {
        action,
        count: recentActions,
      })
      return true
    }
    
    // Check for multiple IPs
    const recentIPs = await prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      select: {
        ipAddress: true,
      },
      distinct: ['ipAddress'],
    })
    
    if (recentIPs.length > 5) {
      await logSecurityEvent(userId, ipAddress, 'MULTIPLE_DEVICES', {
        ipCount: recentIPs.length,
      })
      return true
    }
    
    return false
  } catch (error) {
    logger.error('Suspicious activity detection failed', { error, userId })
    return false
  }
}

async function logSecurityEvent(
  userId: string,
  ipAddress: string,
  type: string,
  metadata: any
) {
  try {
    await prisma.securityEvent.create({
      data: {
        type: type as any,
        severity: 'MEDIUM' as any,
        userId,
        ipAddress,
        description: `Suspicious activity detected: ${type}`,
        metadata,
      },
    })
  } catch (error) {
    logger.error('Failed to log security event', { error })
  }
}
