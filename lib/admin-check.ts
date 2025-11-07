import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

export async function requireAdmin() {
  // Dynamically import auth options to avoid build-time evaluation
  const { authOptions } = await import('./auth')
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
  // Dynamically import auth options to avoid build-time evaluation
  const { authOptions } = await import('./auth')
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return false
  }

  // @ts-ignore - role exists in our extended session
  return session.user.role === 'ADMIN'
}
