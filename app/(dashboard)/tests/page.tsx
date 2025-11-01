import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Clock, FileText, Target } from 'lucide-react'

export default async function TestsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }

  // Get user's interested categories
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      interestedCategories: {
        select: {
          categoryId: true
        }
      }
    }
  })

  // If user has selected categories, filter tests by those categories
  // Otherwise, show all active tests
  const categoryFilter = user?.interestedCategories && user.interestedCategories.length > 0
    ? { categoryId: { in: user.interestedCategories.map(uc => uc.categoryId) } }
    : {}

  const tests = await prisma.test.findMany({
    where: { 
      isActive: true,
      ...categoryFilter
    },
    orderBy: { createdAt: 'desc' },
    include: {
      category: {
        select: {
          name: true,
        }
      },
      _count: {
        select: { attempts: true }
      }
    }
  })

  const getTestTypeBadge = (testType: string) => {
    const badges: Record<string, string> = {
      FULL_LENGTH: 'bg-purple-100 text-purple-800',
      SECTIONAL: 'bg-blue-100 text-blue-800',
      TOPIC_WISE: 'bg-green-100 text-green-800',
      PREVIOUS_YEAR: 'bg-orange-100 text-orange-800',
      CUSTOM: 'bg-gray-100 text-gray-800',
    }
    return badges[testType] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Available Tests</h1>
          <p className="text-gray-600 mt-2">Choose a test to begin your practice</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test) => (
          <Card key={test.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTestTypeBadge(test.testType)}`}>
                  {test.testType.replace(/_/g, ' ')}
                </span>
                {test.isFree && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    FREE
                  </span>
                )}
              </div>
              <CardTitle className="line-clamp-2">{test.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {test.description || 'No description available'}
              </CardDescription>
              <div className="mt-2 text-sm text-gray-600">
                {test.category.name}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  {test.totalQuestions} Questions
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {test.duration} mins
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  Passing: {((test.passingMarks / test.totalMarks) * 100).toFixed(0)}%
                </div>
                <div>
                  {test._count.attempts} attempts
                </div>
              </div>
              <Link href={`/test/${test.id}`}>
                <Button className="w-full">Start Test</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {tests.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">No tests available at the moment</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
