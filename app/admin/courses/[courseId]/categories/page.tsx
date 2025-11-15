'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FolderOpen, Plus, Edit, Trash2, Search, Eye, EyeOff, ArrowLeft, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  order: number
  isActive: boolean
  courseId: string
  _count?: {
    tests: number
    subjects: number
  }
}

interface Course {
  id: string
  title: string
  slug: string
}

export default function CategoriesPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    order: 0,
    isActive: true
  })

  useEffect(() => {
    fetchCourse()
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`)
      const data = await res.json()
      if (data.success) {
        setCourse(data.data)
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/courses/${courseId}/categories`)
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingCategory 
        ? `/api/admin/courses/${courseId}/categories/${editingCategory.id}`
        : `/api/admin/courses/${courseId}/categories`
      
      const method = editingCategory ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        toast.success(editingCategory ? 'Category updated!' : 'Category created!')
        setShowForm(false)
        setEditingCategory(null)
        setFormData({
          name: '',
          description: '',
          icon: '',
          order: 0,
          isActive: true
        })
        fetchCategories()
      } else {
        toast.error(data.message || 'Failed to save category')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      order: category.order || 0,
      isActive: category.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will also delete all tests in this category.')) return

    try {
      const res = await fetch(`/api/admin/courses/${courseId}/categories/${id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Category deleted!')
        fetchCategories()
      } else {
        toast.error(data.message || 'Failed to delete category')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const toggleActive = async (category: Category) => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, isActive: !category.isActive })
      })

      const data = await res.json()

      if (data.success) {
        toast.success(`Category ${!category.isActive ? 'activated' : 'deactivated'}!`)
        fetchCategories()
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/courses')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FolderOpen className="w-8 h-8 text-primary" />
            Categories - {course?.title || 'Loading...'}
          </h1>
          <p className="text-gray-500 mt-1">Manage categories for this course</p>
        </div>
        <Button onClick={() => {
          setShowForm(!showForm)
          if (showForm) {
            setEditingCategory(null)
            setFormData({
              name: '',
              description: '',
              icon: '',
              order: 0,
              isActive: true
            })
          }
        }}>
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Cancel' : 'New Category'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Active Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {categories.filter(c => c.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {categories.reduce((sum, c) => sum + (c._count?.tests || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {categories.reduce((sum, c) => sum + (c._count?.subjects || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCategory ? 'Edit Category' : 'Create New Category'}</CardTitle>
            <CardDescription>Fill in the category details below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., SSC CGL, IBPS PO"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Category description..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="icon">Icon Name (Lucide)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g., BookOpen, Target, Award"
                />
              </div>

              <div>
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  min="0"
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
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false)
                  setEditingCategory(null)
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
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Categories List */}
      {loading ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Loading categories...
          </CardContent>
        </Card>
      ) : filteredCategories.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            {searchTerm ? 'No categories found' : 'No categories yet. Create your first category!'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <Card key={category.id} className={!category.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {category.description || 'No description'}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(category)}
                    title={category.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {category.isActive ? (
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
                      <span className="text-gray-500">Tests:</span>
                      <span className="font-semibold">{category._count?.tests || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subjects:</span>
                      <span className="font-semibold">{category._count?.subjects || 0}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => router.push(`/admin/courses/${courseId}/categories/${category.id}/tests`)}
                      className="flex-1"
                    >
                      <BookOpen className="w-3 h-3 mr-1" />
                      Manage Tests
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
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
