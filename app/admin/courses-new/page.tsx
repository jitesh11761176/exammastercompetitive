import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FolderOpen, BookOpen, FileText, Plus } from 'lucide-react'

export default async function AdminCoursesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/login')
  }

  // Get all courses with their categories and tests count
  const courses = await prisma.course.findMany({
    orderBy: { order: 'asc' },
    include: {
      categories: {
        include: {
          _count: {
            select: {
              tests: true,
              subjects: true
            }
          }
        }
      },
      _count: {
        select: {
          categories: true,
          enrollments: true
        }
      }
    }
  })

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-600 mt-2">Manage courses and their categories</p>
        </div>
        <Link href="/admin/courses/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {courses.map((course) => {
          // Calculate total tests across all categories
          const totalTests = course.categories.reduce((sum, cat) => sum + cat._count.tests, 0)
          const totalSubjects = course.categories.reduce((sum, cat) => sum + cat._count.subjects, 0)

          return (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <FolderOpen className="w-6 h-6 text-primary" />
                      {course.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {course.description || 'No description'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      course.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {course.isActive ? 'Active' : 'Inactive'}
                    </div>
                    {course.isFree && (
                      <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Free
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <BookOpen className="w-5 h-5" />
                      <span className="text-sm font-medium">Categories</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{course._count.categories}</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <FileText className="w-5 h-5" />
                      <span className="text-sm font-medium">Tests</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{totalTests}</p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-600 mb-2">
                      <BookOpen className="w-5 h-5" />
                      <span className="text-sm font-medium">Subjects</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{totalSubjects}</p>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-600 mb-2">
                      <FolderOpen className="w-5 h-5" />
                      <span className="text-sm font-medium">Enrollments</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">{course._count.enrollments}</p>
                  </div>
                </div>

                {/* Categories List */}
                {course.categories.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-700 mb-3">Categories:</h3>
                    <div className="grid gap-2">
                      {course.categories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{category.name}</p>
                            <div className="flex gap-4 mt-1 text-sm text-gray-600">
                              <span>{category._count.subjects} subjects</span>
                              <span>•</span>
                              <span>{category._count.tests} tests</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/admin/courses/${course.id}/categories/${category.id}`}>
                              <Button variant="outline" size="sm">
                                Manage
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-6 pt-6 border-t">
                  <Link href={`/admin/courses/${course.id}/categories/create`}>
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </Link>
                  <Link href={`/admin/courses/${course.id}/edit`}>
                    <Button variant="outline">
                      Edit Course
                    </Button>
                  </Link>
                </div>

                {/* No categories message */}
                {course.categories.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No categories in this course yet</p>
                    <Link href={`/admin/courses/${course.id}/categories/create`}>
                      <Button variant="link" className="mt-2">
                        Create first category
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
      {courses.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first course to get started
            </p>
            <Link href="/admin/courses/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
