import { requireAdmin } from '@/lib/admin-check'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, BookOpen, TrendingUp } from 'lucide-react'

export default async function AdminDashboard() {
  await requireAdmin()
  
  // TODO: Replace with Firestore queries
  const totalTests = 0
  const totalUsers = 0
  const totalQuestions = 0
  const totalAttempts = 0

  const recentTests: any[] = []

  const cards = [
    {
      title: 'Total Tests',
      value: totalTests,
      description: '+12% from last month',
      icon: FileText,
      color: 'text-blue-500',
    },
    {
      title: 'Total Users',
      value: totalUsers,
      description: '+25% from last month',
      icon: Users,
      color: 'text-green-500',
    },
    {
      title: 'Question Bank',
      value: totalQuestions,
      description: 'Across all subjects',
      icon: BookOpen,
      color: 'text-purple-500',
    },
    {
      title: 'Test Attempts',
      value: totalAttempts,
      description: '+18% from last month',
      icon: TrendingUp,
      color: 'text-orange-500',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tests</CardTitle>
          <CardDescription>Latest tests created</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTests.map((test) => (
              <div
                key={test.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="font-semibold">{test.title}</p>
                  <p className="text-sm text-gray-500">
                    {test.totalQuestions} questions • {test._count.attempts} attempts
                  </p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {test.difficulty}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
