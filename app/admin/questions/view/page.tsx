'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, Search, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Question {
  id: string
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: string
  difficulty: string
  topic: {
    name: string
    subject: {
      name: string
      category: {
        name: string
      }
    }
  }
}

export default function ViewQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, categoryFilter])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const url = new URL('/api/admin/questions', window.location.origin)
      url.searchParams.set('page', page.toString())
      url.searchParams.set('limit', '20')
      if (categoryFilter) {
        url.searchParams.set('categoryId', categoryFilter)
      }

      const res = await fetch(url.toString())
      const data = await res.json()

      if (data.success) {
        setQuestions(data.data.questions)
        setTotal(data.data.pagination.total)
      } else {
        toast.error('Failed to fetch questions')
      }
    } catch (error) {
      toast.error('Error fetching questions')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-2">
            📚 View All Questions
          </CardTitle>
          <CardDescription>
            Browse and manage your uploaded questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="category">Filter by Category</Label>
              <select
                id="category"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full mt-2 p-2 border rounded-md"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={() => fetchQuestions()}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Total Questions: <strong>{total}</strong>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <XCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No questions found</p>
            <p className="text-sm text-gray-500 mt-2">
              Try uploading some questions using the Excel uploader
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((q, index) => (
            <Card key={q.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                    {(page - 1) * 20 + index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg">{q.questionText}</h3>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          q.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                          q.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {q.difficulty}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                      <div className={`p-2 rounded border ${q.correctOption === 'A' ? 'bg-green-50 border-green-300' : 'bg-gray-50'}`}>
                        <span className="font-medium">A)</span> {q.optionA}
                        {q.correctOption === 'A' && <CheckCircle2 className="inline w-4 h-4 ml-2 text-green-600" />}
                      </div>
                      <div className={`p-2 rounded border ${q.correctOption === 'B' ? 'bg-green-50 border-green-300' : 'bg-gray-50'}`}>
                        <span className="font-medium">B)</span> {q.optionB}
                        {q.correctOption === 'B' && <CheckCircle2 className="inline w-4 h-4 ml-2 text-green-600" />}
                      </div>
                      <div className={`p-2 rounded border ${q.correctOption === 'C' ? 'bg-green-50 border-green-300' : 'bg-gray-50'}`}>
                        <span className="font-medium">C)</span> {q.optionC}
                        {q.correctOption === 'C' && <CheckCircle2 className="inline w-4 h-4 ml-2 text-green-600" />}
                      </div>
                      <div className={`p-2 rounded border ${q.correctOption === 'D' ? 'bg-green-50 border-green-300' : 'bg-gray-50'}`}>
                        <span className="font-medium">D)</span> {q.optionD}
                        {q.correctOption === 'D' && <CheckCircle2 className="inline w-4 h-4 ml-2 text-green-600" />}
                      </div>
                    </div>

                    <div className="flex gap-2 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        📁 {q.topic.subject.category.name}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                        📚 {q.topic.subject.name}
                      </span>
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded">
                        📖 {q.topic.name}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center px-4">
              Page {page} of {Math.ceil(total / 20)}
            </div>
            <Button
              variant="outline"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / 20)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
