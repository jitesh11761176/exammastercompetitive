"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Wand2, Loader2, CheckCircle, Sparkles, FileText, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface Exam {
  id: string
  name: string
  slug: string
  categoryId: string
  category: {
    id: string
    name: string
  }
}

interface ExamCategory {
  id: string
  name: string
  slug: string
}

export default function AIAssistantPage() {
  const [loading, setLoading] = useState(false)
  const [exams, setExams] = useState<Exam[]>([])
  const [categories, setCategories] = useState<ExamCategory[]>([])
  const [loadingExams, setLoadingExams] = useState(true)
  const [showNewExamDialog, setShowNewExamDialog] = useState(false)
  const [newExam, setNewExam] = useState({ name: '', categoryId: '', description: '' })
  const [creatingExam, setCreatingExam] = useState(false)
  
  const [formData, setFormData] = useState({
    topic: '',
    examType: '',
    difficulty: 'MEDIUM',
    numQuestions: 50,
    categoryId: '',
  })

  useEffect(() => {
    fetchExamsAndCategories()
  }, [])

  const fetchExamsAndCategories = async () => {
    try {
      setLoadingExams(true)
      const [examsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/exams'),
        fetch('/api/admin/exam-categories')
      ])
      
      if (examsRes.ok && categoriesRes.ok) {
        const examsData = await examsRes.json()
        const categoriesData = await categoriesRes.json()
        setExams(examsData.exams || [])
        setCategories(categoriesData.categories || [])
        
        // Set default exam type if available
        if (examsData.exams?.length > 0 && !formData.examType) {
          setFormData(prev => ({ ...prev, examType: examsData.exams[0].name }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error)
      toast.error('Failed to load exam types')
    } finally {
      setLoadingExams(false)
    }
  }

  const handleCreateExam = async () => {
    if (!newExam.name || !newExam.categoryId) {
      toast.error('Please fill in all required fields')
      return
    }

    setCreatingExam(true)
    try {
      const response = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExam),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Exam type "${data.exam.name}" created successfully!`)
        setExams(prev => [...prev, data.exam])
        setFormData(prev => ({ ...prev, examType: data.exam.name }))
        setShowNewExamDialog(false)
        setNewExam({ name: '', categoryId: '', description: '' })
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create exam type')
      }
    } catch (error) {
      toast.error('Failed to create exam type')
    } finally {
      setCreatingExam(false)
    }
  }

  const handleGenerate = async () => {
    if (!formData.topic) {
      toast.error('Please enter a topic')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/ai-generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Test "${data.test.title}" created with ${formData.numQuestions} questions!`)
        
        // Redirect to test page
        window.location.href = `/admin/tests/${data.test.id}`
      } else {
        throw new Error('Failed to generate test')
      }
    } catch (error) {
      toast.error('Failed to generate test')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">AI Test Assistant</h1>
        <p className="text-gray-600">Generate complete tests in seconds</p>
      </div>

      <Tabs defaultValue="topic" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="topic">Generate from Topic</TabsTrigger>
          <TabsTrigger value="syllabus">Generate from Syllabus</TabsTrigger>
        </TabsList>

        <TabsContent value="topic" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                <CardTitle>Topic-Based Generation</CardTitle>
              </div>
              <CardDescription>
                AI will create questions based on your topic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="topic">Topic *</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Algebra, Indian History, Banking Awareness"
                  value={formData.topic}
                  onChange={(e) =>
                    setFormData({ ...formData, topic: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="examType">Exam Type</Label>
                    <Dialog open={showNewExamDialog} onOpenChange={setShowNewExamDialog}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          <Plus className="w-3 h-3 mr-1" />
                          Add New
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Exam Type</DialogTitle>
                          <DialogDescription>
                            Create a new exam type to use in your tests
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="new-exam-name">Exam Name *</Label>
                            <Input
                              id="new-exam-name"
                              placeholder="e.g., CTET, NEET, JEE Main"
                              value={newExam.name}
                              onChange={(e) =>
                                setNewExam({ ...newExam, name: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-exam-category">Category *</Label>
                            <Select
                              value={newExam.categoryId}
                              onValueChange={(value) =>
                                setNewExam({ ...newExam, categoryId: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                              If category doesn't exist, contact admin to create it
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="new-exam-description">Description</Label>
                            <Textarea
                              id="new-exam-description"
                              placeholder="Brief description of the exam"
                              value={newExam.description}
                              onChange={(e) =>
                                setNewExam({ ...newExam, description: e.target.value })
                              }
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setShowNewExamDialog(false)}
                            disabled={creatingExam}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreateExam}
                            disabled={creatingExam}
                          >
                            {creatingExam ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              'Create Exam Type'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Select
                    value={formData.examType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, examType: value })
                    }
                    disabled={loadingExams}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingExams ? "Loading..." : "Select exam type"} />
                    </SelectTrigger>
                    <SelectContent>
                      {exams.map((exam) => (
                        <SelectItem key={exam.id} value={exam.name}>
                          {exam.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) =>
                      setFormData({ ...formData, difficulty: value })
                    }
                  >
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

              <div>
                <Label htmlFor="numQuestions">Number of Questions</Label>
                <Input
                  id="numQuestions"
                  type="number"
                  min="10"
                  max="200"
                  value={formData.numQuestions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numQuestions: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Test with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                <h3 className="font-semibold mb-1">Auto-Categorized</h3>
                <p className="text-sm text-gray-600">
                  Questions automatically tagged by subject and topic
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Sparkles className="w-8 h-8 text-purple-500 mb-2" />
                <h3 className="font-semibold mb-1">Detailed Explanations</h3>
                <p className="text-sm text-gray-600">
                  Every question includes comprehensive explanations
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <FileText className="w-8 h-8 text-blue-500 mb-2" />
                <h3 className="font-semibold mb-1">Exam Pattern Match</h3>
                <p className="text-sm text-gray-600">
                  Questions follow official exam patterns
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="syllabus" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Syllabus-Based Generation</CardTitle>
              <CardDescription>
                Upload syllabus to generate comprehensive test
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="syllabus">Syllabus</Label>
                <Textarea
                  id="syllabus"
                  placeholder="Paste exam syllabus here..."
                  rows={8}
                />
              </div>

              <div>
                <Label htmlFor="pattern">Exam Pattern</Label>
                <Textarea
                  id="pattern"
                  placeholder="Describe exam pattern (sections, marks distribution, etc.)"
                  rows={4}
                />
              </div>

              <Button disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate from Syllabus
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
