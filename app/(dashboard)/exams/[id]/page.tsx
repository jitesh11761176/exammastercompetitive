import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ExamDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Exam Details</h1>
        <p className="text-gray-600 mt-2">Exam ID: {params.id}</p>
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
      import { getServerSession } from 'next-auth'
      import { authOptions } from '@/lib/auth'
      import { redirect } from 'next/navigation'
      import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

      export default async function ExamDetailPage({ params }: { params: { id: string } }) {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
          redirect('/login')
        }
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Exam Details</h1>
              <p className="text-gray-600 mt-2">Exam ID: {params.id}</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Migration in Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">This page is being migrated to Firebase. Full functionality coming soon.</p>
              </CardContent>
            </Card>
          </div>
        )
      }
        {category.tests.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Tests Available</h3>
              <p className="text-gray-600">
                Tests for this category will be added soon
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
