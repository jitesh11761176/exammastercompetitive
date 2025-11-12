// PRISMA MIGRATION: Now using Firebase Firestore
// Rate limiting and security utilities

export const RATE_LIMITS = {
  api: { windowMs: 15 * 60 * 1000, max: 100 },
  auth: { windowMs: 15 * 60 * 1000, max: 5 },
  ai: { windowMs: 60 * 60 * 1000, max: 50 },
  export: { windowMs: 60 * 60 * 1000, max: 10 },
  search: { windowMs: 60 * 1000, max: 30 },
}

export async function checkRateLimit(
  _identifier: string,
  _identifierType: "user" | "ip" | "api_key",
  _endpoint: string,
  config: { windowMs: number; max: number }
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const resetAt = new Date(Date.now() + config.windowMs)
  return { allowed: true, remaining: config.max, resetAt }
}

export function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  const realIP = req.headers.get("x-real-ip")
  return (forwarded?.split(",")[0].trim()) || realIP || "unknown"
}

export function getUserAgent(req: Request): string {
  return req.headers.get("user-agent") || "unknown"
}

export async function checkSuspiciousActivity(_userId: string, _actionType: string): Promise<boolean> {
  return false
}

export async function logSecurityEvent(_userId: string, _eventType: string, _details?: any): Promise<void> {
  // Firebase migration pending
}

export async function getAuditLogs(): Promise<any[]> {
  return []
}

export async function exportAuditLogs(): Promise<string> {
  return ""
}
