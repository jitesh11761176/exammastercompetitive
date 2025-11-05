'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { BookOpen, Plus, Edit, Trash2, Search, Eye, EyeOff, FolderOpen, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

interface Course {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  icon: string | null
  tags: string[]
  price: number
  order: number
  isActive: boolean
  isFree: boolean
  createdAt: string
  _count?: {
    enrollments: number
    categories: number
  }
  categories?: Array<{
    id: string
    name: string
    _count: {
      tests: number
      subjects: number
    }
  }>
}

export default function CoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    icon: '',
    tags: [] as string[],
    price: 0,
    order: 0,
    isActive: true,
    isFree: false
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/courses')
      const data = await res.json()
      setCourses(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingCourse 
        ? `/api/admin/courses/${editingCourse.id}`
        : '/api/admin/courses'
      
      const method = editingCourse ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        toast.success(editingCourse ? 'Course updated!' : 'Course created!')
        setShowForm(false)
        setEditingCourse(null)
        setFormData({
          title: '',
          description: '',
          thumbnail: '',
          icon: '',
          tags: [],
          price: 0,
          order: 0,
          isActive: true,
          isFree: false
        })
        fetchCourses()
      } else {
        toast.error(data.message || 'Failed to save course')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      title: course.title,
      description: course.description || '',
      thumbnail: course.thumbnail || '',
      icon: course.icon || '',
      tags: course.tags || [],
      price: course.price,
      order: course.order || 0,
      isActive: course.isActive,
      isFree: course.isFree || false
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return

    try {
      const res = await fetch(`/api/admin/courses/${id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Course deleted!')
        fetchCourses()
      } else {
        toast.error(data.message || 'Failed to delete course')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const toggleActive = async (course: Course) => {
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...course, isActive: !course.isActive })
      })

      const data = await res.json()

      if (data.success) {
        toast.success(`Course ${!course.isActive ? 'activated' : 'deactivated'}!`)
        fetchCourses()
      } else {
        toast.error(data.message || 'Failed to update course')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            Courses Management
          </h1>
          <p className="text-gray-500 mt-1">Create and manage your courses</p>
        </div>
        <Button onClick={() => {
          setShowForm(!showForm)
          if (showForm) {
            setEditingCourse(null)
            setFormData({
              title: '',
              description: '',
              thumbnail: '',
              icon: '',
              tags: [],
              price: 0,
              order: 0,
              isActive: true,
              isFree: false
            })
          }
        }}>
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Cancel' : 'New Course'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Active Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {courses.filter(c => c.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {courses.reduce((sum, c) => sum + (c._count?.categories || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {courses.reduce((sum, c) => sum + (c.categories?.reduce((s, cat) => s + cat._count.tests, 0) || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {courses.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCourse ? 'Edit Course' : 'Create New Course'}</CardTitle>
            <CardDescription>Fill in the course details below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Complete UPSC Preparation"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Course description..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="isActive" className="cursor-pointer">Active (visible to users)</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false)
                  setEditingCourse(null)
                  setFormData({
                    title: '',
                    description: '',
                    thumbnail: '',
                    icon: '',
                    tags: [],
                    price: 0,
                    order: 0,
                    isActive: true,
                    isFree: false
                  })
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Courses List */}
      {loading ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Loading courses...
          </CardContent>
        </Card>
      ) : filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            {searchTerm ? 'No courses found' : 'No courses yet. Create your first course!'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <Card key={course.id} className={!course.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {course.description || 'No description'}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(course)}
                    title={course.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {course.isActive ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Categories:</span>
                      <span className="font-semibold">{course._count?.categories || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tests:</span>
                      <span className="font-semibold">
                        {course.categories?.reduce((sum, cat) => sum + cat._count.tests, 0) || 0}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-gray-500">Price:</span>
                    <span className="font-semibold">
                      {course.isFree ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        `₹${course.price.toLocaleString()}`
                      )}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 pt-3">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => router.push(`/admin/courses/${course.id}/categories`)}
                      className="flex-1"
                    >
                      <FolderOpen className="w-3 h-3 mr-1" />
                      Manage
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(course)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(course.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
