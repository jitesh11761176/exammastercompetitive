import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, FileText, TrendingUp, Clock } from 'lucide-react'

export default async function ExamsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }

  // Get all active courses with their categories and tests (NEW: Simplified hierarchy)
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    include: {
      categories: {
        where: { isActive: true },
        include: {
          tests: {
            where: { isActive: true },
            select: {
              id: true,
              title: true,
              categoryId: true
            }
          }
        }
      }
    },
    orderBy: { order: 'asc' }
  })

  // Get user with test attempts
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      testAttempts: {
        where: { status: 'COMPLETED' },
        select: {
          id: true,
          testId: true,
          accuracy: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!user) {
    redirect('/login')
  }

  // Calculate stats for each course (NEW: Simplified Course -> Category -> Test)
  const courseStats = courses.map(course => {
    // Get all test IDs under this course
    const allTestIds = course.categories.flatMap(category => 
      category.tests.map(test => test.id)
    )
    
    const totalTests = allTestIds.length
    
    const completedTests = user.testAttempts.filter(attempt => 
      allTestIds.includes(attempt.testId)
    ).length
    
    const avgScore = completedTests > 0
      ? user.testAttempts
          .filter(attempt => allTestIds.includes(attempt.testId))
          .reduce((acc, attempt) => acc + (attempt.accuracy || 0), 0) / completedTests
      : 0

    const recentAttempt = user.testAttempts.find(attempt =>
      allTestIds.includes(attempt.testId)
    )

    return {
      course,
      totalTests,
      completedTests,
      avgScore,
      recentAttempt,
      totalCategories: course.categories.length
    }
  }).filter(stat => stat.totalTests > 0) // Only show courses with tests

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600 mt-2">
            Browse courses and take tests to prepare for your competitive exams
          </p>
        </div>
      </div>

      {/* Course Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courseStats.map(({ course, totalTests, completedTests, avgScore, recentAttempt, totalCategories }) => (
          <Card key={course.id} className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description || 'Prepare for competitive exams in this course'}
                  </CardDescription>
                </div>
                <BookOpen className="w-8 h-8 text-primary opacity-80" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center text-blue-600 mb-1">
                    <FileText className="w-4 h-4 mr-1" />
                    <span className="text-xs font-medium">Total Tests</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">{totalTests}</div>
                  <div className="text-xs text-blue-600 mt-1">{totalCategories} categor{totalCategories !== 1 ? 'ies' : 'y'}</div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center text-green-600 mb-1">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-xs font-medium">Completed</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">{completedTests}</div>
                  <div className="text-xs text-green-600 mt-1">
                    {totalTests > 0 ? ((completedTests / totalTests) * 100).toFixed(0) : 0}% progress
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">
                    {totalTests > 0 ? ((completedTests / totalTests) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ 
                      width: `${totalTests > 0 ? (completedTests / totalTests) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>

              {/* Average Score */}
              {completedTests > 0 && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-gray-600">Avg. Score</span>
                  <span className="text-lg font-bold text-primary">
                    {avgScore.toFixed(1)}%
                  </span>
                </div>
              )}

              {/* Recent Activity */}
              {recentAttempt && (
                <div className="flex items-center text-xs text-gray-500 pt-2 border-t">
                  <Clock className="w-3 h-3 mr-1" />
                  Last attempt: {new Date(recentAttempt.createdAt).toLocaleDateString()}
                </div>
              )}

              {/* View Categories Button */}
              <div className="space-y-2">
                {course.categories.map(category => (
                  <Link key={category.id} href={`/exams/category/${category.id}`}>
                    <Button variant="outline" className="w-full" size="sm">
                      {category.name} ({category.tests.length} test{category.tests.length !== 1 ? 's' : ''})
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {courseStats.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tests Available Yet</h3>
            <p className="text-gray-600 mb-4">
              Tests will be added soon. Check back later!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
