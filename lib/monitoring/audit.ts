// lib/monitoring/audit.ts
// MIGRATED: This module has been converted to use Firebase Firestore instead of Prisma

import { getFirebaseFirestore } from '../firebase'
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore'

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
    const firestore = getFirebaseFirestore()
    if (!firestore) return
    
    const logsRef = collection(firestore, 'auditLogs')
    await addDoc(logsRef, {
      action,
      userId: context.userId,
      userEmail: context.userEmail,
      userRole: context.userRole,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      resource: details.resource,
      resourceId: details.resourceId,
      changes: details.changes,
      metadata: details.metadata,
      status,
      errorMessage: error,
      duration: details.duration,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Failed to create audit log', { action, error: err })
  }
}

// Audit middleware for tracking changes
export function auditChange<T extends Record<string, any>>(
  before: T,
  after: T
): Record<string, { before: any; after: any }> {
  const changes: Record<string, { before: any; after: any }> = {}
  
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
  limit_?: number
  offset_?: number
}) {
  try {
    const firestore = getFirebaseFirestore()
    if (!firestore) return { logs: [], total: 0 }
    
    const logsRef = collection(firestore, 'auditLogs')
    const constraints: any[] = [orderBy('timestamp', 'desc')]
    
    if (filters.userId) constraints.push(where('userId', '==', filters.userId))
    if (filters.action) constraints.push(where('action', '==', filters.action))
    if (filters.resource) constraints.push(where('resource', '==', filters.resource))
    
    if (filters.limit_) constraints.push(limit(filters.limit_))
    
    const q = query(logsRef, ...constraints)
    const snap = await getDocs(q)
    
    return {
      logs: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      total: snap.size
    }
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return { logs: [], total: 0 }
  }
}

// Export audit logs for compliance
export async function exportAuditLogs(
  startDate: Date,
  endDate: Date,
  format: 'json' | 'csv' = 'json'
) {
  try {
    const firestore = getFirebaseFirestore()
    if (!firestore) return format === 'csv' ? '' : '[]'
    
    const logsRef = collection(firestore, 'auditLogs')
    const q = query(
      logsRef,
      where('timestamp', '>=', startDate.toISOString()),
      where('timestamp', '<=', endDate.toISOString()),
      orderBy('timestamp', 'asc')
    )
    
    const snap = await getDocs(q)
    const logs = snap.docs.map(doc => doc.data())
    
    if (format === 'csv') {
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
      
      const rows = logs.map((log: any) => [
        log.timestamp || '',
        log.userId || '',
        log.userEmail || '',
        log.action,
        log.resource,
        log.resourceId || '',
        log.status,
        log.ipAddress || '',
      ])
      
      return [headers, ...rows].map((row: any) => row.join(',')).join('\n')
    }
    
    return JSON.stringify(logs, null, 2)
  } catch (error) {
    console.error('Error exporting audit logs:', error)
    return format === 'csv' ? '' : '[]'
  }
}

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

// OLD PRISMA CODE REMOVED - SEE FIREBASE IMPLEMENTATIONS ABOVE
