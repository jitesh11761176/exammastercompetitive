import Link from 'next/link'
import { ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-red-100 p-6">
        <ShieldOff className="h-16 w-16 text-red-600" />
      </div>
      <h1 className="mt-6 text-4xl font-bold">Access Denied</h1>
      <p className="mt-3 text-lg text-muted-foreground max-w-md">
        You don&apos;t have permission to access this page. This area is restricted to administrators and content creators only.
      </p>
      <div className="mt-8 flex gap-4">
        <Button asChild variant="default">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  )
}
