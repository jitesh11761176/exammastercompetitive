import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { redirect } from 'next/navigation'

export type AppRole = 'STUDENT' | 'CREATOR' | 'ADMIN'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireRole(allowedRoles: AppRole[]) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }

  const userRole = (session.user as any).role || 'STUDENT'
  
  if (!allowedRoles.includes(userRole)) {
    redirect('/403')
  }

  return session.user
}
