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

  // Get user's interested categories with test counts and stats
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      interestedCategories: {
        include: {
          category: {
            include: {
              tests: {
                where: { isActive: true },
                include: {
                  _count: {
                    select: { attempts: true }
                  }
                }
              }
            }
          }
        }
      },
      testAttempts: {
        include: {
          test: {
            select: {
              categoryId: true
            }
          }
        }
      }
    }
  })

  if (!user) {
    redirect('/login')
  }

  // Check if user needs onboarding
  const needsOnboarding = !user.interestedCategories || user.interestedCategories.length === 0

  if (needsOnboarding) {
    redirect('/onboarding')
  }

  // Calculate stats per category
  const categoryStats = user.interestedCategories.map(ic => {
    const category = ic.category
    const totalTests = category.tests.length
    const completedTests = user.testAttempts.filter(
      attempt => attempt.test.categoryId === category.id && attempt.status === 'COMPLETED'
    ).length
    const avgScore = user.testAttempts
      .filter(attempt => attempt.test.categoryId === category.id && attempt.status === 'COMPLETED')
      .reduce((acc, attempt) => acc + (attempt.accuracy || 0), 0) / (completedTests || 1)

    const recentAttempt = user.testAttempts
      .filter(attempt => attempt.test.categoryId === category.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

    return {
      category,
      totalTests,
      completedTests,
      avgScore: completedTests > 0 ? avgScore : 0,
      recentAttempt
    }
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Exam Categories</h1>
          <p className="text-gray-600 mt-2">
            Select an exam to view all available tests and track your progress
          </p>
        </div>
        <Link href="/onboarding">
          <Button variant="outline">Manage Categories</Button>
        </Link>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoryStats.map(({ category, totalTests, completedTests, avgScore, recentAttempt }) => (
          <Link key={category.id} href={`/exams/${category.id}`}>
            <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{category.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {category.description || 'Prepare for this competitive exam'}
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
                      <span className="text-xs font-medium">Tests</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">{totalTests}</div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center text-green-600 mb-1">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span className="text-xs font-medium">Completed</span>
                    </div>
                    <div className="text-2xl font-bold text-green-900">{completedTests}</div>
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

                {/* Call to Action */}
                <Button className="w-full mt-4" size="sm">
                  View All Tests
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {categoryStats.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Exam Categories Selected</h3>
            <p className="text-gray-600 mb-4">
              Start by selecting the exams you&apos;re preparing for
            </p>
            <Link href="/onboarding">
              <Button>Select Exam Categories</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
