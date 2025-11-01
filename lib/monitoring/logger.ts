import { prisma } from '@/lib/prisma'
import { ErrorSeverity } from '@prisma/client'

// Custom logger with database persistence
class Logger {
  private async persistLog(level: ErrorSeverity, message: string, context?: any) {
    if (process.env.NODE_ENV === 'production') {
      try {
        await prisma.errorLog.create({
          data: {
            message,
            severity: level,
            stack: context?.stack,
            code: context?.code,
            userId: context?.userId,
            path: context?.path,
            method: context?.method,
            metadata: context?.metadata,
            environment: process.env.NODE_ENV,
            userAgent: context?.userAgent,
            ipAddress: context?.ipAddress,
          },
        })
      } catch (error) {
        // Fallback to console if DB write fails
        console.error('Failed to persist log:', error)
      }
    }
  }

  debug(message: string, context?: any) {
    console.debug(`[DEBUG] ${message}`, context)
    // Don't persist debug logs
  }

  info(message: string, context?: any) {
    console.info(`[INFO] ${message}`, context)
    if (context?.persist) {
      this.persistLog('INFO', message, context)
    }
  }

  warn(message: string, context?: any) {
    console.warn(`[WARN] ${message}`, context)
    this.persistLog('WARNING', message, context)
  }

  error(message: string, context?: any) {
    console.error(`[ERROR] ${message}`, context)
    this.persistLog('ERROR', message, context)
  }

  critical(message: string, context?: any) {
    console.error(`[CRITICAL] ${message}`, context)
    this.persistLog('CRITICAL', message, context)
    
    // Send alert for critical errors
    this.sendAlert(message, context)
  }

  private async sendAlert(message: string, context?: any) {
    // TODO: Integrate with alerting service (Slack, PagerDuty, etc.)
    // For now, just log
    console.error('🚨 CRITICAL ALERT:', message, context)
  }
}

export const logger = new Logger()

// Metric tracking
export async function trackMetric(name: string, value: number, tags?: Record<string, any>) {
  try {
    await prisma.systemMetric.create({
      data: {
        name,
        value,
        unit: tags?.unit,
        tags,
      },
    })
  } catch (error) {
    logger.warn('Failed to track metric', { name, value, error })
  }
}

// Performance tracking
export function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = performance.now()
    
    try {
      const result = await fn()
      const duration = performance.now() - start
      
      await trackMetric(`performance.${operation}`, duration, {
        unit: 'ms',
        operation,
      })
      
      if (duration > 1000) {
        logger.warn(`Slow operation: ${operation}`, { duration })
      }
      
      resolve(result)
    } catch (error) {
      const duration = performance.now() - start
      logger.error(`Operation failed: ${operation}`, {
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      reject(error)
    }
  })
}
