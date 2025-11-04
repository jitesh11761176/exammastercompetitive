import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, BookOpen, FileText, Clock } from 'lucide-react'

export default async function ExamCategoryDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }

  const categoryId = params.id

  // Get exam category with all exams and their test series
  const examCategory = await prisma.examCategory.findUnique({
    where: { id: categoryId },
    include: {
      exams: {
        where: { isActive: true },
        include: {
          testSeries: {
            include: {
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
                  testType: true
                }
              }
            }
          }
        },
        orderBy: { order: 'asc' }
      }
    }
  })

  if (!examCategory) {
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
          Back to Exam Categories
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{examCategory.name}</h1>
            <p className="text-gray-600 mt-2">
              {examCategory.description || 'Browse all available exams in this category'}
            </p>
          </div>
        </div>
      </div>

      {/* Exams List */}
      <div className="space-y-6">
        {examCategory.exams.map((exam) => {
          // Count total tests in this exam
          const totalTests = exam.testSeries.reduce((sum, series) => sum + series.tests.length, 0)
          
          // Count completed tests for this exam
          const allTestIds = exam.testSeries.flatMap(series => series.tests.map(test => test.id))
          const completedCount = user?.testAttempts.filter(attempt => 
            allTestIds.includes(attempt.testId)
          ).length || 0

          return (
            <Card key={exam.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <BookOpen className="w-6 h-6 text-primary" />
                      <CardTitle className="text-2xl">{exam.name}</CardTitle>
                    </div>
                    <CardDescription>
                      {exam.description || 'Prepare for this exam with our comprehensive test series'}
                    </CardDescription>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    exam.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {exam.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 mb-1">Test Series</div>
                    <div className="text-2xl font-bold text-blue-900">{exam.testSeries.length}</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-purple-600 mb-1">Total Tests</div>
                    <div className="text-2xl font-bold text-purple-900">{totalTests}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600 mb-1">Completed</div>
                    <div className="text-2xl font-bold text-green-900">{completedCount}</div>
                  </div>
                </div>

                {/* Test Series */}
                {exam.testSeries.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Test Series:</h3>
                    <div className="grid gap-3">
                      {exam.testSeries.map((series) => (
                        <div
                          key={series.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{series.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {series.description || 'Test series for comprehensive preparation'}
                              </p>
                            </div>
                            <div className="text-sm text-gray-600">
                              {series.tests.length} test{series.tests.length !== 1 ? 's' : ''}
                            </div>
                          </div>

                          {/* Tests in this series */}
                          {series.tests.length > 0 && (
                            <div className="grid gap-2 mt-3 pt-3 border-t">
                              {series.tests.map((test) => {
                                const userAttempt = user?.testAttempts.find(a => a.testId === test.id)
                                
                                return (
                                  <div
                                    key={test.id}
                                    className="flex items-center justify-between p-3 bg-white border rounded hover:shadow-sm transition-all"
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">{test.title}</div>
                                      <div className="flex gap-3 mt-1 text-xs text-gray-600">
                                        <span className="flex items-center">
                                          <FileText className="w-3 h-3 mr-1" />
                                          {test.totalQuestions} questions
                                        </span>
                                        <span className="flex items-center">
                                          <Clock className="w-3 h-3 mr-1" />
                                          {test.duration} mins
                                        </span>
                                        {test.isFree && (
                                          <span className="text-green-600 font-medium">FREE</span>
                                        )}
                                      </div>
                                      {userAttempt && (
                                        <div className="mt-1 text-xs text-green-600 font-medium">
                                          ✓ Completed - Score: {userAttempt.accuracy.toFixed(1)}%
                                        </div>
                                      )}
                                    </div>
                                    <Link href={`/test/${test.id}`}>
                                      <Button size="sm" variant={userAttempt ? 'outline' : 'default'}>
                                        {userAttempt ? 'Retake' : 'Start'}
                                      </Button>
                                    </Link>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No test series message */}
                {exam.testSeries.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No test series available for this exam yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty state */}
      {examCategory.exams.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Exams Available</h3>
            <p className="text-gray-600">
              Exams for this category will be added soon
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
