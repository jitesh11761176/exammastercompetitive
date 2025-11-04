import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, FileText, Clock } from 'lucide-react'

export default async function ExamCategoryDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }

  const categoryId = params.id

  // Get category with all tests (NEW: Using simplified Course -> Category -> Test hierarchy)
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true
        }
      },
      tests: {
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          description: true,
          duration: true,
          totalQuestions: true,
          totalMarks: true,
          passingMarks: true,
          isFree: true,
          difficulty: true,
          testType: true,
          pyqYear: true
        },
        orderBy: { order: 'asc' }
      }
    }
  })

  if (!category) {
    redirect('/exams')
  }

  // Get user's test attempts
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      testAttempts: {
        where: { status: 'COMPLETED' },
        select: {
          testId: true,
          accuracy: true,
          createdAt: true
        }
      }
    }
  })

  return (
    <div className="space-y-8">
      {/* Breadcrumb & Header */}
      <div>
        <Link href="/exams" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Courses
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-2">
              {category.course.title}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
            <p className="text-gray-600 mt-2">
              {category.description || 'Browse all available tests in this category'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600 mb-1">Total Tests</div>
          <div className="text-2xl font-bold text-blue-900">{category.tests.length}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-600 mb-1">Free Tests</div>
          <div className="text-2xl font-bold text-purple-900">
            {category.tests.filter(t => t.isFree).length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600 mb-1">Completed</div>
          <div className="text-2xl font-bold text-green-900">
            {user?.testAttempts.filter(a => 
              category.tests.some(t => t.id === a.testId)
            ).length || 0}
          </div>
        </div>
      </div>

      {/* Tests Grid */}
      {category.tests.length > 0 ? (
        <div className="grid gap-4">
          {category.tests.map((test) => {
            const userAttempt = user?.testAttempts.find(a => a.testId === test.id)
            
            return (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <CardTitle className="text-xl">{test.title}</CardTitle>
                        {test.pyqYear && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                            PYQ {test.pyqYear}
                          </span>
                        )}
                      </div>
                      <CardDescription>
                        {test.description || 'Test your knowledge and track your progress'}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {test.isFree && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          FREE
                        </span>
                      )}
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        test.difficulty === 'EASY' ? 'bg-blue-100 text-blue-800' :
                        test.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {test.difficulty}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-6 text-sm text-gray-600">
                      <span className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        {test.totalQuestions} questions
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {test.duration} mins
                      </span>
                      <span>
                        {test.totalMarks} marks
                      </span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {test.testType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {userAttempt && (
                        <div className="text-sm">
                          <span className="text-green-600 font-medium">
                            ✓ Score: {userAttempt.accuracy.toFixed(1)}%
                          </span>
                        </div>
                      )}
                      <Link href={`/test/${test.id}`}>
                        <Button size="sm" variant={userAttempt ? 'outline' : 'default'}>
                          {userAttempt ? 'Retake' : 'Start Test'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
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
  )
}
