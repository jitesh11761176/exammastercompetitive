import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Trophy, Target, Zap, Award } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }

  // Fetch user stats
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      testAttempts: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { test: true }
      },
      userBadges: {
        include: { badge: true }
      },
      analytics: true,
      gamification: true,
      interestedCategories: {
        include: {
          category: true
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
            : `Preparing for ${user.interestedCategories.map(ic => ic.category.name).join(', ')}`
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

      {/* Recent Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Test Attempts</CardTitle>
          <CardDescription>Your latest performance</CardDescription>
        </CardHeader>
        <CardContent>
          {user?.testAttempts && user.testAttempts.length > 0 ? (
            <div className="space-y-4">
              {user.testAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{attempt.test.title}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(attempt.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {attempt.accuracy?.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {attempt.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No test attempts yet</p>
              <Link href="/tests">
                <Button>Browse Tests</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Practice Tests</CardTitle>
            <CardDescription>Browse and attempt tests</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/tests">
              <Button className="w-full">View All Tests</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>View Analytics</CardTitle>
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
