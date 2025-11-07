import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ExamsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Exams</h1>
        <p className="text-gray-600 mt-2">Browse available exams and categories</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Migration in Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            This page is being migrated to Firebase. Full functionality coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
