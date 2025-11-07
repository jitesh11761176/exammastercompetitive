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
      </Card>
    </div>
  )
}
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }

  const categoryId = params.id

  // Get category with all tests
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      tests: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { attempts: true }
          }
        }
      },
      subjects: {
        select: {
          name: true,
          _count: {
            select: { topics: true }
          }
        }
      }
    }
  })

  if (!category) {
    redirect('/exams')
  }

  // Get user's attempts for this category
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      testAttempts: {
        where: {
          test: {
            categoryId: categoryId
          }
        },
        include: {
          test: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  const userAttempts = user?.testAttempts || []
  const completedAttempts = userAttempts.filter((a: any) => a.status === 'COMPLETED')
  const avgScore = completedAttempts.length > 0
    ? completedAttempts.reduce((acc: number, a: any) => acc + (a.accuracy || 0), 0) / completedAttempts.length
    : 0

  const getTestTypeBadge = (testType: string) => {
    const badges: Record<string, { variant: any, label: string }> = {
      FULL_LENGTH: { variant: 'default', label: 'Full Length' },
      SECTIONAL: { variant: 'secondary', label: 'Sectional' },
      TOPIC_WISE: { variant: 'outline', label: 'Topic Wise' },
      PREVIOUS_YEAR: { variant: 'destructive', label: 'Previous Year' },
      CUSTOM: { variant: 'outline', label: 'Custom' },
    }
    return badges[testType] || { variant: 'outline', label: testType }
  }

  // Get user's test status (attempted or not)
  const getTestStatus = (testId: string) => {
    const attempts = userAttempts.filter((a: any) => a.test.id === testId)
    if (attempts.length === 0) return null
    
    const completed = attempts.filter((a: any) => a.status === 'COMPLETED')
    if (completed.length === 0) return { type: 'in-progress', count: attempts.length }
    
    const bestScore = Math.max(...completed.map((a: any) => a.accuracy || 0))
    return { type: 'completed', count: completed.length, bestScore }
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb & Header */}
      <div>
        <Link href="/exams" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to My Exams
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
            <p className="text-gray-600 mt-2">
              {category.description || 'Browse all available tests for this exam'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900">{category.tests.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedAttempts.length}</p>
              </div>
              <Trophy className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Score</p>
                <p className="text-2xl font-bold text-primary">{avgScore.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Subjects</p>
                <p className="text-2xl font-bold text-gray-900">{category.subjects.length}</p>
              </div>
              <Target className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tests Grid */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Available Tests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {category.tests.map((test: any) => {
            const testStatus = getTestStatus(test.id)
            const badge = getTestTypeBadge(test.testType)
            
            return (
              <Card key={test.id} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={badge.variant as any}>{badge.label}</Badge>
                    {test.isFree ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        FREE
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        PRO
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="line-clamp-2 text-lg">{test.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {test.description || 'Test your knowledge and skills'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Test Info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center text-gray-600">
                      <FileText className="w-4 h-4 mr-1" />
                      {test.totalQuestions} Questions
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      {test.duration} mins
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Target className="w-4 h-4 mr-1" />
                      Pass: {((test.passingMarks / test.totalMarks) * 100).toFixed(0)}%
                    </div>
                    <div className="text-gray-600">
                      {test._count.attempts} attempts
                    </div>
                  </div>

                  {/* User Status */}
                  {testStatus && (
                    <div className="pt-3 border-t">
                      {testStatus.type === 'completed' ? (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-600 font-medium">✓ Completed</span>
                          <span className="font-bold text-green-700">
                            Best: {(testStatus.bestScore || 0).toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-orange-600 font-medium">
                          ⏳ In Progress ({testStatus.count} attempt{testStatus.count > 1 ? 's' : ''})
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <Link href={`/test/${test.id}`}>
                    <Button className="w-full" variant={testStatus ? 'outline' : 'default'}>
                      {testStatus?.type === 'completed' ? 'Retake Test' : testStatus ? 'Continue' : 'Start Test'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

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
