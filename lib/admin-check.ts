import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { redirect } from 'next/navigation'

export async function requireAdmin() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  // @ts-ignore - role exists in our extended session
  if (session.user.role !== 'ADMIN') {
    redirect('/403')
  }

  return session
}

export async function isAdmin() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return false
  }

  // @ts-ignore - role exists in our extended session
  return session.user.role === 'ADMIN'
}
