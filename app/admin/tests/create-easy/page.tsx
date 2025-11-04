'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { 
  Plus, Wand2, Upload, Trash2, 
  ArrowRight, ArrowLeft, Sparkles 
} from 'lucide-react'

type Step = 1 | 2 | 3 | 4

interface Question {
  id: string
  content: string
  options: { A: string; B: string; C: string; D: string }
  correctAnswer: string
  explanation?: string
  marks: number
}

export default function EasyTestCreator() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)

  // Test basic info
  const [testInfo, setTestInfo] = useState({
    title: '',
    description: '',
    examType: 'SSC CGL',
    difficulty: 'MEDIUM',
    duration: 60,
    totalMarks: 100,
  })

  // Questions
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: '',
    content: '',
    options: { A: '', B: '', C: '', D: '' },
    correctAnswer: 'A',
    explanation: '',
    marks: 1,
  })

  // AI Generation
  const [aiTopic, setAiTopic] = useState('')
  const [aiNumQuestions, setAiNumQuestions] = useState(10)
  const [generating, setGenerating] = useState(false)

  // Step 1: Basic Info
  const renderStep1 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">📝 Test Details</CardTitle>
          <CardDescription>Let&apos;s start with the basics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Test Title *</Label>
            <Input
              id="title"
              placeholder="e.g., SSC CGL Mock Test 2024"
              value={testInfo.title}
              onChange={(e) => setTestInfo({ ...testInfo, title: e.target.value })}
              className="text-lg"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the test"
              value={testInfo.description}
              onChange={(e) => setTestInfo({ ...testInfo, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Exam Type</Label>
              <Select value={testInfo.examType} onValueChange={(value) => setTestInfo({ ...testInfo, examType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SSC CGL">SSC CGL</SelectItem>
                  <SelectItem value="SSC CHSL">SSC CHSL</SelectItem>
                  <SelectItem value="UPSC IAS">UPSC IAS</SelectItem>
                  <SelectItem value="IBPS PO">IBPS PO</SelectItem>
                  <SelectItem value="Railway NTPC">Railway NTPC</SelectItem>
                  <SelectItem value="Bank Clerk">Bank Clerk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Difficulty</Label>
              <Select value={testInfo.difficulty} onValueChange={(value) => setTestInfo({ ...testInfo, difficulty: value })}>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={testInfo.duration}
                onChange={(e) => setTestInfo({ ...testInfo, duration: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label>Total Marks</Label>
              <Input
                type="number"
                value={testInfo.totalMarks}
                onChange={(e) => setTestInfo({ ...testInfo, totalMarks: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => setStep(2)}
        disabled={!testInfo.title}
        className="w-full"
        size="lg"
      >
        Next: Add Questions
        <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </div>
  )

  // Step 2: Choose Method
  const renderStep2 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">➕ How do you want to add questions?</CardTitle>
          <CardDescription>Choose the easiest method for you</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition" onClick={() => setStep(3)}>
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wand2 className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="font-bold text-lg mb-2">AI Generate</h3>
            <p className="text-sm text-gray-600 mb-3">
              Let AI create questions instantly
            </p>
            <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
              ⚡ Fastest
            </span>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition" onClick={() => setStep(4)}>
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="font-bold text-lg mb-2">Add Manually</h3>
            <p className="text-sm text-gray-600 mb-3">
              Type questions one by one
            </p>
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
              🎯 Full Control
            </span>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition" onClick={() => router.push('/admin/upload-excel')}>
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="font-bold text-lg mb-2">Bulk Upload</h3>
            <p className="text-sm text-gray-600 mb-3">
              Upload PDF, CSV, or images
            </p>
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
              📚 Multiple
            </span>
          </CardContent>
        </Card>
      </div>

      <Button onClick={() => setStep(1)} variant="outline" className="w-full">
        <ArrowLeft className="mr-2 w-4 h-4" />
        Back to Test Details
      </Button>
    </div>
  )

  // Step 3: AI Generate
  const handleAIGenerate = async () => {
    if (!aiTopic) {
      toast.error('Please enter a topic')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/admin/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          examType: testInfo.examType,
          difficulty: testInfo.difficulty,
          count: aiNumQuestions,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const generatedQuestions: Question[] = data.questions.map((q: any, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          content: q.question || q.questionText || q.text,
          options: q.options || { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
          correctAnswer: q.correctAnswer || q.answer || 'A',
          explanation: q.explanation || '',
          marks: 1,
        }))
        setQuestions(generatedQuestions)
        toast.success(`Generated ${generatedQuestions.length} questions!`)
        // Auto-save after generation
        saveTest(generatedQuestions)
      } else {
        throw new Error('Failed to generate')
      }
    } catch (error) {
      toast.error('Failed to generate questions. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">🤖 AI Question Generator</CardTitle>
          <CardDescription>Tell AI what questions you need</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Topic / Subject</Label>
            <Input
              placeholder="e.g., Algebra, Indian History, Banking Awareness"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              className="text-lg"
            />
          </div>

          <div>
            <Label>Number of Questions: {aiNumQuestions}</Label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              className="w-full"
              value={aiNumQuestions}
              onChange={(e) => setAiNumQuestions(parseInt(e.target.value))}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold mb-2">✨ What AI will generate:</h4>
            <ul className="space-y-1 text-sm">
              <li>✓ {aiNumQuestions} high-quality MCQ questions</li>
              <li>✓ 4 options per question</li>
              <li>✓ Detailed explanations</li>
              <li>✓ Auto-categorized by subject & topic</li>
            </ul>
          </div>

          <Button
            onClick={handleAIGenerate}
            disabled={!aiTopic || generating}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 w-4 h-4" />
                Generate with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Button onClick={() => setStep(2)} variant="outline" className="w-full">
        <ArrowLeft className="mr-2 w-4 h-4" />
        Back to Methods
      </Button>
    </div>
  )

  // Step 4: Manual Add
  const handleAddQuestion = () => {
    if (!currentQuestion.content.trim()) {
      toast.error('Please enter a question')
      return
    }

    if (!currentQuestion.options.A || !currentQuestion.options.B || !currentQuestion.options.C || !currentQuestion.options.D) {
      toast.error('Please fill all options')
      return
    }

    setQuestions([...questions, { ...currentQuestion, id: Date.now().toString() }])
    setCurrentQuestion({
      id: '',
      content: '',
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: 'A',
      explanation: '',
      marks: 1,
    })
    toast.success('Question added successfully')
  }

  const renderStep4 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">✏️ Add Question</CardTitle>
              <CardDescription>Question {questions.length + 1}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{questions.length}</div>
              <div className="text-xs text-gray-500">Questions Added</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Question Text *</Label>
            <Textarea
              placeholder="Type your question here..."
              value={currentQuestion.content}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, content: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label>Options *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                <div key={opt} className="relative">
                  <Input
                    placeholder={`Option ${opt}`}
                    value={currentQuestion.options[opt]}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        options: { ...currentQuestion.options, [opt]: e.target.value },
                      })
                    }
                    className="pl-10"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                    {opt}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Correct Answer *</Label>
            <div className="flex gap-2">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                <Button
                  key={opt}
                  onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: opt })}
                  variant={currentQuestion.correctAnswer === opt ? 'default' : 'outline'}
                  className="flex-1"
                >
                  {opt}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>Explanation (Optional)</Label>
            <Textarea
              placeholder="Explain why this is the correct answer..."
              value={currentQuestion.explanation}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleAddQuestion} className="flex-1" size="lg">
              <Plus className="mr-2 w-4 h-4" />
              Add Question
            </Button>
            <Button
              onClick={() => saveTest(questions)}
              disabled={questions.length === 0 || saving}
              variant="default"
              className="bg-green-500 hover:bg-green-600"
              size="lg"
            >
              {saving ? 'Saving...' : `Done (${questions.length})`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Questions Added ({questions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {questions.map((q, index) => (
                <div key={q.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                    {index + 1}
                  </div>
                  <div className="flex-1 text-sm">{q.content.slice(0, 60)}...</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuestions(questions.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={() => setStep(2)} variant="outline" className="w-full">
        <ArrowLeft className="mr-2 w-4 h-4" />
        Back to Methods
      </Button>
    </div>
  )

  // Save Test
  const saveTest = async (questionsToSave: Question[]) => {
    if (questionsToSave.length === 0) {
      toast.error('Add at least one question')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/tests/create-easy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testInfo,
          questions: questionsToSave,
        }),
      })

      if (response.ok) {
        await response.json()
        toast.success(`Test "${testInfo.title}" created with ${questionsToSave.length} questions!`)
        router.push('/admin/tests')
      } else {
        throw new Error('Failed to create test')
      }
    } catch (error) {
      toast.error('Failed to create test. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">✨ Super Easy Test Creator</h1>
        <p className="text-gray-600">Create professional tests in minutes, not hours!</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <Progress value={(step / 4) * 100} className="mb-2" />
        <div className="flex justify-between text-sm text-gray-600">
          <span className={step >= 1 ? 'font-semibold text-blue-600' : ''}>Test Info</span>
          <span className={step >= 2 ? 'font-semibold text-blue-600' : ''}>Add Method</span>
          <span className={step >= 3 ? 'font-semibold text-blue-600' : ''}>Questions</span>
          <span className={step === 4 ? 'font-semibold text-blue-600' : ''}>Done</span>
        </div>
      </div>

      {/* Steps */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </div>
  )
}
