'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Clock,
  FileText,
  Award,
  CheckCircle,
  XCircle,
  Download,
  Play,
  AlertCircle,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { offlineStorage } from '@/lib/offline-storage';
import { OfflineStorage } from '@/lib/offline-storage';
import { toast } from 'sonner'

export default function TestDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [test, setTest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  const fetchTestDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/tests/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch test')
      const data = await response.json()
      setTest(data)
    } catch (error) {
      console.error('Error fetching test:', error)
      toast.error('Failed to load test details')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (params.id) {
      fetchTestDetails()
    }
  }, [params.id, fetchTestDetails])

  const startTest = async () => {
    setStarting(true)
    try {
      const response = await fetch(`/api/tests/${params.id}/start`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to start test')

      const data = await response.json()
      router.push(`/test/${params.id}?attemptId=${data.attempt.id}`)
    } catch (error) {
      console.error('Error starting test:', error)
      toast.error('Failed to start test')
      setStarting(false)
    }
  }

  const downloadForOffline = async () => {
    if (!OfflineStorage.isSupported()) {
      toast.error('Offline storage not supported')
      return
    }

    try {
      await offlineStorage.saveTest({
        id: test.id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        questions: test.questions,
        cachedAt: Date.now(),
      })
      toast.success('Test downloaded for offline use')
    } catch (error) {
      console.error('Error downloading:', error)
      toast.error('Failed to download test')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold">Test not found</h3>
      </div>
    )
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 text-green-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'HARD':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{test.title}</CardTitle>
              <CardDescription className="text-base">{test.description}</CardDescription>
            </div>
            {test.isPremium && (
              <Badge className="ml-4 bg-amber-100 text-amber-800">
                <Award className="w-4 h-4 mr-1" />
                Premium
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline">{test.category.name}</Badge>
            <Badge variant="outline">{test.subject.name}</Badge>
            <Badge className={getDifficultyColor(test.difficulty)}>{test.difficulty}</Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center text-primary mb-2">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold">{test.totalQuestions}</div>
              <div className="text-sm text-gray-500">Questions</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-primary mb-2">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold">{test.duration}</div>
              <div className="text-sm text-gray-500">Minutes</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-primary mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold">{test.passingScore}%</div>
              <div className="text-sm text-gray-500">Pass Mark</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-primary mb-2">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold">{test._count.attempts}</div>
              <div className="text-sm text-gray-500">Attempts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marking Scheme */}
      <Card>
        <CardHeader>
          <CardTitle>Marking Scheme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Marks per question</span>
            <span className="font-semibold">Variable (based on difficulty)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Negative marking</span>
            <span className="font-semibold">-0.25 marks for wrong answers</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total duration</span>
            <span className="font-semibold">{test.duration} minutes</span>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
              <span>The test contains {test.totalQuestions} questions to be completed in {test.duration} minutes.</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Each question carries marks as indicated, with negative marking for incorrect answers.</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
              <span>You can navigate between questions using the question palette or Previous/Next buttons.</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Your answers are auto-saved every 30 seconds. You can also save manually.</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
              <span>You can mark questions for review and revisit them before submitting.</span>
            </li>
            <li className="flex items-start">
              <XCircle className="w-5 h-5 mr-2 text-red-600 flex-shrink-0 mt-0.5" />
              <span>The test will auto-submit when the timer reaches zero.</span>
            </li>
            <li className="flex items-start">
              <XCircle className="w-5 h-5 mr-2 text-red-600 flex-shrink-0 mt-0.5" />
              <span>Do not refresh the page during the test, or you may lose progress.</span>
            </li>
            <li className="flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Keyboard shortcuts: Use 1-4 for options, N for next, P for previous, M to mark for review.</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Sample Questions Preview */}
      {test.questions && test.questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sample Questions</CardTitle>
            <CardDescription>Preview of questions in this test</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {test.questions.slice(0, 3).map((question: any, index: number) => (
              <div key={question.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="font-medium mb-2">
                  Q{index + 1}. {question.questionText}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Type: {question.questionType} • Marks: {question.marks} • Difficulty: {question.difficulty}
                </div>
              </div>
            ))}
            {test.questions.length > 3 && (
              <div className="text-sm text-gray-500 text-center">
                + {test.questions.length - 3} more questions
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          size="lg"
          className="flex-1"
          onClick={startTest}
          disabled={starting}
        >
          {starting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Starting...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Start Test
            </>
          )}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={downloadForOffline}
        >
          <Download className="w-5 h-5 mr-2" />
          Download for Offline
        </Button>
      </div>
    </div>
  )
}
