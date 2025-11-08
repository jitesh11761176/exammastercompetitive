'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export default function SessionDebug() {
  const { data: session, status } = useSession()

  useEffect(() => {
    console.log('=== SESSION DEBUG ===')
    console.log('Status:', status)
    console.log('Session:', session)
    console.log('User:', session?.user)
    console.log('Role:', (session?.user as any)?.role)
    console.log('==================')
  }, [session, status])

  if (status === 'loading') {
    return <div className="p-4 bg-yellow-100 text-yellow-800 rounded">Loading session...</div>
  }

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="font-bold mb-2">Session Debug Info:</h3>
      <pre className="text-xs overflow-auto">
        {JSON.stringify({ 
          status,
          user: session?.user,
          role: (session?.user as any)?.role 
        }, null, 2)}
      </pre>
    </div>
  )
}
