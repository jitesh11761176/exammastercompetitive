'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Question {
  content: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  explanation: string
  marks: number
}

export default function CreateTestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Test Info
  const [testTitle, setTestTitle] = useState('')
  const [testDescription, setTestDescription] = useState('')
  const [duration, setDuration] = useState(60)
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM')

  // Questions
  const [questions, setQuestions] = useState<Question[]>([
    {
      content: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: '',
      marks: 1
    }
  ])

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        content: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: 'A',
        explanation: '',
        marks: 1
      }
    ])
  }

  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      toast.error('Test must have at least one question')
      return
    }
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!testTitle.trim()) {
      toast.error('Please enter a test title')
      return
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.content.trim()) {
        toast.error(`Question ${i + 1}: Please enter question text`)
        return
      }
      if (!q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()) {
        toast.error(`Question ${i + 1}: All options are required`)
        return
      }
      if (!q.explanation.trim()) {
        toast.error(`Question ${i + 1}: Please provide an explanation`)
        return
      }
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/tests/create-easy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testInfo: {
            title: testTitle,
            description: testDescription,
            duration,
            difficulty,
            examType: 'CUSTOM'
          },
          questions: questions.map(q => ({
            content: q.content,
            options: {
              A: q.optionA,
              B: q.optionB,
              C: q.optionC,
              D: q.optionD
            },
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            marks: q.marks
          }))
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create test')
      }

      toast.success('✅ Test created successfully!')
      router.push('/admin/tests')
    } catch (error: any) {
      console.error('Error creating test:', error)
      toast.error(error.message || 'Failed to create test')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/tests">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Test</h1>
          <p className="text-gray-600">Simple test creation - no AI required</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Test Information */}
        <Card>
          <CardHeader>
            <CardTitle>Test Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Test Title *</Label>
              <Input
                id="title"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                placeholder="e.g., Mathematics Chapter 1 Test"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={testDescription}
                onChange={(e) => setTestDescription(e.target.value)}
                placeholder="Brief description of the test"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Question Text *</Label>
                  <Textarea
                    value={question.content}
                    onChange={(e) => updateQuestion(index, 'content', e.target.value)}
                    placeholder="Enter the question"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Option A *</Label>
                    <Input
                      value={question.optionA}
                      onChange={(e) => updateQuestion(index, 'optionA', e.target.value)}
                      placeholder="Option A"
                    />
                  </div>
                  <div>
                    <Label>Option B *</Label>
                    <Input
                      value={question.optionB}
                      onChange={(e) => updateQuestion(index, 'optionB', e.target.value)}
                      placeholder="Option B"
                    />
                  </div>
                  <div>
                    <Label>Option C *</Label>
                    <Input
                      value={question.optionC}
                      onChange={(e) => updateQuestion(index, 'optionC', e.target.value)}
                      placeholder="Option C"
                    />
                  </div>
                  <div>
                    <Label>Option D *</Label>
                    <Input
                      value={question.optionD}
                      onChange={(e) => updateQuestion(index, 'optionD', e.target.value)}
                      placeholder="Option D"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Correct Answer *</Label>
                    <Select
                      value={question.correctAnswer}
                      onValueChange={(value: any) => updateQuestion(index, 'correctAnswer', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Marks</Label>
                    <Input
                      type="number"
                      min="1"
                      value={question.marks}
                      onChange={(e) => updateQuestion(index, 'marks', parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Explanation *</Label>
                  <Textarea
                    value={question.explanation}
                    onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                    placeholder="Explain why this is the correct answer"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addQuestion}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Question
          </Button>
        </div>

        {/* Submit */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-900">
                  Total: {questions.length} question{questions.length !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-blue-700">
                  Total Marks: {questions.reduce((sum, q) => sum + q.marks, 0)}
                </p>
              </div>
              <Button type="submit" size="lg" disabled={loading}>
                {loading ? 'Creating Test...' : 'Create Test'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
