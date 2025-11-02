import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FolderOpen, BookOpen, FileQuestion, TestTube } from 'lucide-react'

export default async function AdminCategoriesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/login')
  }

  // Get all categories with counts
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      subjects: {
        include: {
          topics: {
            include: {
              _count: {
                select: { questions: true }
              }
            }
          }
        }
      },
      tests: true,
      _count: {
        select: {
          subjects: true,
          tests: true
        }
      }
    }
  })

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600 mt-2">View and manage all categories, subjects, and questions</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/upload-excel">
            <Button>Upload Questions</Button>
          </Link>
          <Link href="/admin/ai">
            <Button variant="outline">AI Assistant</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6">
        {categories.map((category) => {
          // Calculate total questions across all subjects and topics
          const totalQuestions = category.subjects.reduce((sum, subject) => {
            return sum + subject.topics.reduce((topicSum, topic) => {
              return topicSum + topic._count.questions
            }, 0)
          }, 0)

          return (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <FolderOpen className="w-6 h-6 text-primary" />
                      {category.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {category.description || 'No description'}
                    </CardDescription>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    category.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <BookOpen className="w-5 h-5" />
                      <span className="text-sm font-medium">Subjects</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{category._count.subjects}</p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-600 mb-2">
                      <FileQuestion className="w-5 h-5" />
                      <span className="text-sm font-medium">Questions</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{totalQuestions}</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <TestTube className="w-5 h-5" />
                      <span className="text-sm font-medium">Tests</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{category._count.tests}</p>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-600 mb-2">
                      <FolderOpen className="w-5 h-5" />
                      <span className="text-sm font-medium">Topics</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">
                      {category.subjects.reduce((sum, s) => sum + s.topics.length, 0)}
                    </p>
                  </div>
                </div>

                {/* Subjects List */}
                {category.subjects.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-700 mb-3">Subjects:</h3>
                    <div className="grid gap-2">
                      {category.subjects.map((subject) => {
                        const subjectQuestions = subject.topics.reduce((sum, topic) => {
                          return sum + topic._count.questions
                        }, 0)

                        return (
                          <div
                            key={subject.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{subject.name}</p>
                              <div className="flex gap-4 mt-1 text-sm text-gray-600">
                                <span>{subject.topics.length} topics</span>
                                <span>•</span>
                                <span>{subjectQuestions} questions</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/admin/questions/view?categoryId=${category.id}`}>
                                <Button variant="outline" size="sm">
                                  View Questions
                                </Button>
                              </Link>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* No subjects message */}
                {category.subjects.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No subjects in this category yet</p>
                    <Link href="/admin/upload-excel">
                      <Button variant="link" className="mt-2">
                        Upload questions to create subjects
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Tests */}
                {category.tests.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-semibold text-gray-700 mb-3">Tests ({category.tests.length}):</h3>
                    <div className="grid gap-2">
                      {category.tests.slice(0, 5).map((test) => (
                        <div
                          key={test.id}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{test.title}</p>
                            <div className="flex gap-2 mt-1 text-sm text-gray-600">
                              <span>{test.totalQuestions} questions</span>
                              <span>•</span>
                              <span>{test.duration} mins</span>
                              <span>•</span>
                              <span className={test.isFree ? 'text-green-600' : 'text-orange-600'}>
                                {test.isFree ? 'Free' : 'Premium'}
                              </span>
                            </div>
                          </div>
                          <Link href={`/test/${test.id}`}>
                            <Button variant="outline" size="sm">
                              View Test
                            </Button>
                          </Link>
                        </div>
                      ))}
                      {category.tests.length > 5 && (
                        <Link href="/admin/tests">
                          <Button variant="link" size="sm">
                            View all {category.tests.length} tests →
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty state */}
      {categories.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories yet</h3>
            <p className="text-gray-600 mb-4">
              Upload questions to automatically create categories
            </p>
            <Link href="/admin/upload-excel">
              <Button>Upload Questions</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
