import { prisma } from '@/lib/prisma'
import { logger } from './logger'

export interface AuditContext {
  userId?: string
  userEmail?: string
  userRole?: string
  ipAddress?: string
  userAgent?: string
}

export interface AuditDetails {
  resource: string
  resourceId?: string
  changes?: any
  metadata?: any
  duration?: number
}

// Create audit log entry
export async function createAuditLog(
  action: string,
  context: AuditContext,
  details: AuditDetails,
  status: 'SUCCESS' | 'FAILURE' = 'SUCCESS',
  error?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        action: action as any,
        userId: context.userId,
        userEmail: context.userEmail,
        userRole: context.userRole as any,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        resource: details.resource,
        resourceId: details.resourceId,
        changes: details.changes,
        metadata: details.metadata,
        status: status as any,
        errorMessage: error,
        duration: details.duration,
      },
    })
  } catch (err) {
    logger.error('Failed to create audit log', { action, error: err })
  }
}

// Audit middleware for tracking changes
export function auditChange<T extends Record<string, any>>(
  before: T,
  after: T
): Record<string, { before: any; after: any }> {
  const changes: Record<string, { before: any; after: any }> = {}
  
  // Compare all fields
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])
  
  for (const key of allKeys) {
    if (before[key] !== after[key]) {
      changes[key] = {
        before: before[key],
        after: after[key],
      }
    }
  }
  
  return changes
}

// Helper to get client IP from request
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIP || 'unknown'
}

// Helper to get user agent
export function getUserAgent(req: Request): string {
  return req.headers.get('user-agent') || 'unknown'
}

// Query audit logs with filters
export async function getAuditLogs(filters: {
  userId?: string
  action?: string
  resource?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const where: any = {}
  
  if (filters.userId) where.userId = filters.userId
  if (filters.action) where.action = filters.action
  if (filters.resource) where.resource = filters.resource
  
  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = filters.startDate
    if (filters.endDate) where.createdAt.lte = filters.endDate
  }
  
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ])
  
  return { logs, total }
}

// Export audit logs for compliance
export async function exportAuditLogs(
  startDate: Date,
  endDate: Date,
  format: 'json' | 'csv' = 'json'
) {
  const logs = await prisma.auditLog.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { createdAt: 'asc' },
  })
  
  if (format === 'csv') {
    // Convert to CSV format
    const headers = [
      'Timestamp',
      'User ID',
      'User Email',
      'Action',
      'Resource',
      'Resource ID',
      'Status',
      'IP Address',
    ]
    
    const rows = logs.map(log => [
      log.createdAt.toISOString(),
      log.userId || '',
      log.userEmail || '',
      log.action,
      log.resource,
      log.resourceId || '',
      log.status,
      log.ipAddress || '',
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }
  
  return JSON.stringify(logs, null, 2)
}
