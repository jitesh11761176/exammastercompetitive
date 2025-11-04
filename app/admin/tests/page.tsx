import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TestDeleteButton } from './test-delete-button'

export default async function AdminTestsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/login')
  }

  // Get ALL tests for admin view
  const tests = await prisma.test.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      category: {
        select: {
          name: true,
        }
      },
      _count: {
        select: { attempts: true }
      }
    }
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Tests (Admin View)</h1>
          <p className="text-gray-600 mt-2">Manage all tests in the system</p>
        </div>
        <Link href="/admin/ai">
          <Button>Create New Test</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tests.map((test: any) => (
          <Card key={test.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="mb-2">{test.title}</CardTitle>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Category: {test.category.name}</span>
                    <span>•</span>
                    <span>{test.totalQuestions} questions</span>
                    <span>•</span>
                    <span>{test.duration} mins</span>
                    <span>•</span>
                    <span>{test._count.attempts} attempts</span>
                    <span>•</span>
                    <span className={test.isActive ? 'text-green-600' : 'text-red-600'}>
                      {test.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span>•</span>
                    <span className={test.isFree ? 'text-green-600' : 'text-orange-600'}>
                      {test.isFree ? 'Free' : 'Premium'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/test/${test.id}`}>
                    <Button variant="outline" size="sm">View Test</Button>
                  </Link>
                  <TestDeleteButton testId={test.id} testName={test.title} />
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {tests.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600 mb-4">No tests created yet</p>
            <Link href="/admin/ai">
              <Button>Create Your First Test</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
