import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Trophy, Target, Zap, Award, BookOpen, ArrowRight, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }

  const isAdmin = (session.user as any).role === 'ADMIN'

  // If admin, show admin dashboard
  if (isAdmin) {
    return <AdminDashboard />
  }

  // Regular user dashboard continues below
  // Fetch user stats
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      testAttempts: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { 
          test: {
            include: {
              category: {
                select: { name: true }
              }
            }
          }
        }
      },
      userBadges: {
        include: { badge: true }
      },
      analytics: true,
      gamification: true,
      interestedCategories: {
        include: {
          category: {
            include: {
              tests: {
                where: { isActive: true }
              }
            }
          }
        }
      }
    }
  })

  if (!user) {
    redirect('/login')
  }

  // Create analytics and gamification if missing
  if (!user.analytics) {
    await prisma.analytics.create({
      data: { userId: user.id }
    })
  }

  if (!user.gamification) {
    await prisma.gamification.create({
      data: { userId: user.id }
    })
  }

  // Check if user needs onboarding
  const needsOnboarding = !user.interestedCategories || user.interestedCategories.length === 0

  const totalAttempts = await prisma.testAttempt.count({
    where: { userId: user.id }
  })

  const completedAttempts = await prisma.testAttempt.count({
    where: { 
      userId: user.id,
      status: 'COMPLETED'
    }
  })

  const avgScoreResult = await prisma.testAttempt.aggregate({
    where: { 
      userId: user.id,
      status: 'COMPLETED'
    },
    _avg: {
      accuracy: true
    }
  })

  const avgScore = avgScoreResult._avg?.accuracy || 0

  // Calculate category stats
  const categoryStats = user.interestedCategories.map((ic: any) => {
    const totalTests = ic.category.tests.length
    const completedTests = user.testAttempts.filter(
      (attempt: any) => attempt.test.categoryId === ic.category.id && attempt.status === 'COMPLETED'
    ).length
    return {
      id: ic.category.id,
      name: ic.category.name,
      totalTests,
      completedTests,
      progress: totalTests > 0 ? (completedTests / totalTests) * 100 : 0
    }
  })

  return (
    <div className="space-y-8">
      {/* Onboarding Banner */}
      {needsOnboarding && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">🎯 Personalize Your Experience</h3>
                <p className="text-gray-600">
                  Select the exams you&apos;re preparing for to see only relevant tests and get personalized recommendations.
                </p>
              </div>
              <Link href="/onboarding">
                <Button size="lg">Select Exams</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          {needsOnboarding 
            ? "Get started by selecting your target exams above"
            : `Preparing for ${user.interestedCategories.map((ic: any) => ic.category.name).join(', ')}`
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttempts}</div>
            <p className="text-xs text-muted-foreground">
              {completedAttempts} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgScore.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all tests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.gamification?.totalPoints || 0}</div>
            <p className="text-xs text-muted-foreground">
              Level {user.gamification?.currentLevel || 1}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.userBadges.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Achievements unlocked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* My Exam Categories */}
      {!needsOnboarding && categoryStats.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">My Exam Categories</h2>
            <Link href="/exams" className="text-primary hover:underline flex items-center text-sm font-medium">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryStats.slice(0, 3).map((category: any) => (
              <Link key={category.id} href={`/exams/${category.id}`}>
                <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{category.name}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{category.totalTests} tests</span>
                          <span>•</span>
                          <span>{category.completedTests} completed</span>
                        </div>
                      </div>
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{category.progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${category.progress}%` }}
                        />
                      </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline" size="sm">
                      View Tests <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Tests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Test Attempts</CardTitle>
              <CardDescription>Your latest performance</CardDescription>
            </div>
            <Link href="/analytics" className="text-primary hover:underline text-sm font-medium">
              View Analytics <ArrowRight className="w-4 h-4 ml-1 inline" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {user?.testAttempts && user.testAttempts.length > 0 ? (
            <div className="space-y-4">
              {user.testAttempts.map((attempt: any) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{attempt.test.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600">
                        {attempt.test.category.name}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        {new Date(attempt.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {attempt.accuracy?.toFixed(1)}%
                    </div>
                    <div className={`text-sm ${attempt.status === 'COMPLETED' ? 'text-green-600' : 'text-orange-600'}`}>
                      {attempt.status === 'COMPLETED' ? '✓ Completed' : '⏳ In Progress'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No test attempts yet</p>
              <Link href="/exams">
                <Button>Browse My Exams</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-primary" />
              My Exams
            </CardTitle>
            <CardDescription>View all your exam categories</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/exams">
              <Button className="w-full">View Categories</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-primary" />
              Practice Tests
            </CardTitle>
            <CardDescription>Browse all available tests</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/tests">
              <Button className="w-full" variant="outline">
                Browse Tests
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Analytics
            </CardTitle>
            <CardDescription>Track your performance</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/analytics">
              <Button className="w-full" variant="outline">
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Admin Dashboard Component
async function AdminDashboard() {
  // Get admin statistics
  const [totalUsers, totalTests, totalCategories, totalQuestions, recentActivity] = await Promise.all([
    prisma.user.count(),
    prisma.test.count(),
    prisma.category.count(),
    prisma.question.count(),
    prisma.testAttempt.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        test: { select: { title: true } }
      }
    })
  ])

  const activeUsers = await prisma.user.count({
    where: {
      testAttempts: {
        some: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }
    }
  })

  const completedTests = await prisma.testAttempt.count({
    where: { status: 'COMPLETED' }
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your exam platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Target className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalUsers}</div>
            <p className="text-sm text-gray-500 mt-1">
              {activeUsers} active this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Tests</CardTitle>
            <BookOpen className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTests}</div>
            <p className="text-sm text-gray-500 mt-1">
              {completedTests} attempts completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Categories</CardTitle>
            <Award className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCategories}</div>
            <p className="text-sm text-gray-500 mt-1">
              Exam categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Questions</CardTitle>
            <Zap className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalQuestions}</div>
            <p className="text-sm text-gray-500 mt-1">
              Total question bank
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-primary" />
              AI Assistant
            </CardTitle>
            <CardDescription>Upload questions & create exams</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/ai">
              <Button className="w-full">Open AI Assistant</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-primary" />
              Manage Tests
            </CardTitle>
            <CardDescription>View and edit all tests</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/tests">
              <Button className="w-full" variant="outline">
                Manage Tests
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Analytics
            </CardTitle>
            <CardDescription>Platform performance</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/analytics">
              <Button className="w-full" variant="outline">
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Test Attempts</CardTitle>
          <CardDescription>Latest activity on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              recentActivity.map((attempt: any) => (
                <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{attempt.user.name}</p>
                    <p className="text-xs text-gray-600">{attempt.test.title}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      attempt.status === 'COMPLETED' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {attempt.status === 'COMPLETED' 
                        ? `${Math.round(attempt.accuracy || 0)}%` 
                        : 'In Progress'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(attempt.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
