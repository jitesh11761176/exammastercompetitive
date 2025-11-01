import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Award, Calendar, TrendingUp, Zap } from 'lucide-react'



export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      userBadges: {
        include: { badge: true },
        orderBy: { unlockedAt: 'desc' }
      },
      testAttempts: {
        where: { status: 'COMPLETED' },
        orderBy: { endTime: 'desc' },
        take: 10
      },
      gamification: true,
      analytics: true
    }
  })

  if (!user) {
    redirect('/login')
  }

  const currentLevel = user.gamification?.currentLevel || 1
  const currentPoints = user.gamification?.totalPoints || 0
  const pointsForCurrentLevel = (currentLevel - 1) * (currentLevel - 1) * 100
  const pointsForNextLevel = currentLevel * currentLevel * 100
  const progressToNextLevel = ((currentPoints - pointsForCurrentLevel) / (pointsForNextLevel - pointsForCurrentLevel)) * 100

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">Manage your account and track your progress</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-8">
          <div className="flex items-start space-x-6">
            {user.image && (
              <img
                src={user.image}
                alt={user.name || ''}
                className="w-24 h-24 rounded-full"
              />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{user.name}</h2>
              <p className="text-gray-600 mb-4">{user.email}</p>

              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    {user.gamification?.dailyStreak || 0} day streak
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Level Progress</CardTitle>
          <CardDescription>Keep earning points to level up</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-primary">Level {currentLevel}</div>
                <div className="text-sm text-gray-600">
                  {currentPoints} / {pointsForNextLevel} points
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-medium text-gray-900">
                  {pointsForNextLevel - currentPoints} points to next level
                </div>
                <div className="text-sm text-gray-600">
                  {progressToNextLevel.toFixed(1)}% complete
                </div>
              </div>
            </div>
            <Progress value={progressToNextLevel} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges Earned ({user.userBadges.length})</CardTitle>
          <CardDescription>Your achievements</CardDescription>
        </CardHeader>
        <CardContent>
          {user.userBadges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {user.userBadges.map((userBadge: any) => (
                <Card key={userBadge.id} className="text-center">
                  <CardContent className="p-4">
                    <div className="text-4xl mb-2">{userBadge.badge.icon}</div>
                    <div className="font-medium text-sm mb-1">{userBadge.badge.name}</div>
                    <div className="text-xs text-gray-600 mb-2">
                      {userBadge.badge.description}
                    </div>
                    <div className="inline-flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                      <Zap className="w-3 h-3" />
                      <span>{userBadge.badge.points} pts</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <Award className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p>No badges earned yet. Keep taking tests to unlock achievements!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest test attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {user.testAttempts.length > 0 ? (
            <div className="space-y-3">
              {user.testAttempts.map((attempt: any) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{attempt.testId}</div>
                    <div className="text-sm text-gray-600">
                      {attempt.endTime?.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      (attempt.accuracy || 0) >= 70 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {attempt.accuracy?.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {attempt.score} / {attempt.totalMarks}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <p>No activity yet. Start taking tests to see your progress here!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
