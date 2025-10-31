import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Award, Zap } from 'lucide-react'

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }

  const topUsers = await prisma.user.findMany({
    take: 50,
    orderBy: { 
      gamification: {
        totalPoints: 'desc'
      }
    },
    select: {
      id: true,
      name: true,
      image: true,
      email: true,
      gamification: {
        select: {
          totalPoints: true,
          currentLevel: true,
        }
      }
    }
  })

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: {
      id: true,
      gamification: {
        select: {
          totalPoints: true,
        }
      }
    }
  })

  const currentUserRank = await prisma.user.count({
    where: {
      gamification: {
        totalPoints: {
          gt: currentUser?.gamification?.totalPoints || 0
        }
      }
    }
  }) + 1

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-gray-600 mt-2">Compete with others and climb the ranks</p>
      </div>

      {/* Current User Rank */}
      <Card className="bg-gradient-to-r from-primary to-secondary text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Your Rank</p>
              <p className="text-4xl font-bold">#{currentUserRank}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Your Points</p>
              <p className="text-4xl font-bold">{currentUser?.gamification?.totalPoints || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top 3 */}
      <div className="grid md:grid-cols-3 gap-6">
        {topUsers.slice(0, 3).map((user, index) => {
          const medals = ['🥇', '🥈', '🥉']
          const colors = [
            'bg-yellow-50 border-yellow-200',
            'bg-gray-50 border-gray-200',
            'bg-amber-50 border-amber-200'
          ]
          
          return (
            <Card key={user.id} className={`${colors[index]} border-2`}>
              <CardHeader className="text-center">
                <div className="text-4xl mb-2">{medals[index]}</div>
                {user.image && (
                  <img
                    src={user.image}
                    alt={user.name || ''}
                    className="w-20 h-20 rounded-full mx-auto mb-4"
                  />
                )}
                <CardTitle className="text-xl">{user.name}</CardTitle>
                <CardDescription>Level {user.gamification?.currentLevel || 1}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span className="text-2xl font-bold">{user.gamification?.totalPoints || 0}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Full Rankings</CardTitle>
          <CardDescription>Top performers across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topUsers.map((user, index) => {
              const isCurrentUser = user.id === currentUser?.id
              
              return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    isCurrentUser
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 text-center font-bold text-lg">
                      {index + 1}
                    </div>
                    {user.image && (
                      <img
                        src={user.image}
                        alt={user.name || ''}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium">
                        {user.name}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs bg-primary text-white px-2 py-1 rounded">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">Level {user.gamification?.currentLevel || 1}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span className="font-bold text-lg">{user.gamification?.totalPoints || 0}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
