import * as Sentry from '@sentry/nextjs'

export function initSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      
      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Session replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      
      // Integrations (use defaults to avoid type mismatch across versions)
      integrations: [],
      
      // Filter sensitive data
  beforeSend(event, _hint) {
        // Remove sensitive data
        if (event.request) {
          delete event.request.cookies
          if (event.request.headers) {
            delete event.request.headers['Authorization']
            delete event.request.headers['Cookie']
          }
        }
        
        // Filter out known errors
        if (event.exception?.values?.[0]?.value?.includes('Network request failed')) {
          return null
        }
        
        return event
      },
    })
  }
}

// Custom error capturing with context
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  })
}

// Set user context
export function setUserContext(user: { id: string; email?: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  })
}

// Clear user context (on logout)
export function clearUserContext() {
  Sentry.setUser(null)
}

// Add breadcrumb for debugging
export function addBreadcrumb(message: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    data,
    timestamp: Date.now() / 1000,
  })
}

// Start transaction for performance monitoring
export function startTransaction(name: string, op: string) {
  return (Sentry as any).startTransaction({
    name,
    op,
  })
}
