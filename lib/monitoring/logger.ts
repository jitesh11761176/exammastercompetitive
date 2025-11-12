// MIGRATED FROM PRISMA: Now uses Firebase Firestore
// All logging now goes through console + Firebase collection 'logs' when initialized

enum ErrorSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

// Custom logger with database persistence (Firebase backend)
class Logger {
  private async persistLog(level: ErrorSeverity, message: string, context?: any) {
    // TODO: Implement Firebase logging when needed
    console.log(`[${level}] ${message}`, context)
  }

  debug(message: string, context?: any) {
    console.debug(`[DEBUG] ${message}`, context)
  }

  info(message: string, context?: any) {
    console.info(`[INFO] ${message}`, context)
    if (context?.persist) {
      this.persistLog(ErrorSeverity.INFO, message, context)
    }
  }

  warn(message: string, context?: any) {
    console.warn(`[WARN] ${message}`, context)
    this.persistLog(ErrorSeverity.WARNING, message, context)
  }

  error(message: string, context?: any) {
    console.error(`[ERROR] ${message}`, context)
    this.persistLog(ErrorSeverity.ERROR, message, context)
  }

  critical(message: string, context?: any) {
    console.error(`[CRITICAL] ${message}`, context)
    this.persistLog(ErrorSeverity.CRITICAL, message, context)
    this.sendAlert(message, context)
  }

  private async sendAlert(message: string, context?: any) {
    // TODO: Integrate with alerting service (Slack, PagerDuty, etc.)
    console.error('🚨 CRITICAL ALERT:', message, context)
  }
}

export const logger = new Logger()

// Metric tracking (stub - Firebase backend TBD)
export async function trackMetric(name: string, value: number, tags?: Record<string, any>) {
  try {
    console.debug('Metric tracked:', { name, value, tags })
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
