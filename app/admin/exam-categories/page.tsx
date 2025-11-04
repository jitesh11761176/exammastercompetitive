import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FolderOpen, BookOpen, FileQuestion, TestTube } from 'lucide-react'

export default async function AdminExamCategoriesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/login')
  }

  // Get all exam categories with counts
  const examCategories = await prisma.examCategory.findMany({
    orderBy: { order: 'asc' },
    include: {
      exams: {
        include: {
          testSeries: {
            include: {
              tests: {
                select: {
                  id: true
                }
              }
            }
          },
          courses: true,
          pyqCollections: true,
          _count: {
            select: {
              testSeries: true,
              courses: true,
              pyqCollections: true
            }
          }
        }
      },
      _count: {
        select: {
          exams: true
        }
      }
    }
  })

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Category Management</h1>
          <p className="text-gray-600 mt-2">View and manage all exam categories and their associated exams</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/ai-assistant">
            <Button>Create Exam Type</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6">
        {examCategories.map((examCategory) => {
          // Calculate total resources
          const totalTestSeries = examCategory.exams.reduce((sum, exam) => sum + exam._count.testSeries, 0)
          const totalCourses = examCategory.exams.reduce((sum, exam) => sum + exam._count.courses, 0)
          const totalPyq = examCategory.exams.reduce((sum, exam) => sum + exam._count.pyqCollections, 0)
          const totalTests = examCategory.exams.reduce((sum, exam) => {
            return sum + exam.testSeries.reduce((tsSum, ts) => tsSum + ts.tests.length, 0)
          }, 0)

          return (
            <Card key={examCategory.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <FolderOpen className="w-6 h-6 text-primary" />
                      {examCategory.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {examCategory.description || 'No description'}
                    </CardDescription>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    examCategory.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {examCategory.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <BookOpen className="w-5 h-5" />
                      <span className="text-sm font-medium">Exams</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{examCategory._count.exams}</p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-600 mb-2">
                      <TestTube className="w-5 h-5" />
                      <span className="text-sm font-medium">Test Series</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{totalTestSeries}</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <FileQuestion className="w-5 h-5" />
                      <span className="text-sm font-medium">Tests</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{totalTests}</p>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-600 mb-2">
                      <BookOpen className="w-5 h-5" />
                      <span className="text-sm font-medium">Courses</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">{totalCourses}</p>
                  </div>
                </div>

                {/* Exams List */}
                {examCategory.exams.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-700 mb-3">Exams:</h3>
                    <div className="grid gap-2">
                      {examCategory.exams.map((exam) => {
                        const examTests = exam.testSeries.reduce((sum, ts) => sum + ts.tests.length, 0)

                        return (
                          <div
                            key={exam.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{exam.name}</p>
                              <div className="flex gap-4 mt-1 text-sm text-gray-600">
                                <span>{exam._count.testSeries} test series</span>
                                <span>•</span>
                                <span>{examTests} tests</span>
                                <span>•</span>
                                <span>{exam._count.courses} courses</span>
                              </div>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              exam.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {exam.isActive ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* No exams message */}
                {examCategory.exams.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No exams in this category yet</p>
                    <Link href="/admin/ai-assistant">
                      <Button variant="link" className="mt-2">
                        Create an exam type
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty state */}
      {examCategories.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No exam categories yet</h3>
            <p className="text-gray-600 mb-4">
              Create exam categories to organize your exams
            </p>
            <Link href="/admin/ai-assistant">
              <Button>Create Exam Category</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
