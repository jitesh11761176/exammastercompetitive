'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useExamStore } from '@/lib/store'
import { formatTime } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Flag, Send } from 'lucide-react'

export default function TestPage() {
  const params = useParams()
  const router = useRouter()
  const testId = params.id as string
  
  const {
    currentQuestionIndex,
    answers,
    markedForReview,
    timeRemaining,
    isSubmitting,
    setCurrentQuestion,
    setAnswer,
    toggleMarkForReview,
    setTimeRemaining,
    setIsSubmitting,
    resetExam,
  } = useExamStore()

  const [test, setTest] = useState<any>(null)
  const [attemptId, setAttemptId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTest()
    return () => resetExam()
  }, [testId])

  useEffect(() => {
    if (!timeRemaining || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining(timeRemaining - 1)
      
      if (timeRemaining <= 1) {
        handleSubmit()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining])

  const loadTest = async () => {
    try {
      const response = await fetch(`/api/tests/${testId}`)
      const data = await response.json()
      setTest(data)
      setTimeRemaining(data.duration * 60)
      
      // Start attempt
      const attemptRes = await fetch('/api/attempts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId })
      })
      const attemptData = await attemptRes.json()
      setAttemptId(attemptData.id)
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading test:', error)
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await fetch(`/api/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      })
      router.push(`/test/${testId}/result/${attemptId}`)
    } catch (error) {
      console.error('Error submitting test:', error)
      setIsSubmitting(false)
    }
  }

  if (loading || !test) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading test...</p>
        </div>
      </div>
    )
  }

  // Check if test has questions
  if (!test.questions || test.questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-600">This test has no questions yet.</p>
          <Button onClick={() => router.push('/tests')} className="mt-4">
            Back to Tests
          </Button>
        </div>
      </div>
    )
  }

  const currentQuestion = test.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100
  const answeredCount = Object.keys(answers).length
  const markedCount = markedForReview.size

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{test.title}</h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {test.questions.length}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`text-lg font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                {formatTime(timeRemaining)}
              </div>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                <Send className="w-4 h-4 mr-2" />
                Submit Test
              </Button>
            </div>
          </div>
          <Progress value={progress} className="mt-4" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-600">
                        Question {currentQuestionIndex + 1}
                      </span>
                      <span className="text-sm font-medium text-primary">
                        {currentQuestion.marks} mark(s)
                      </span>
                    </div>
                    <h2 className="text-lg font-medium mb-4">
                      {currentQuestion.questionText}
                    </h2>
                  </div>

                  {/* Options */}
                  {currentQuestion.questionType === 'SINGLE_CHOICE' && (
                    <div className="space-y-3">
                      {currentQuestion.options.map((option: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => setAnswer(currentQuestion.id, option)}
                          className={`w-full p-4 text-left border-2 rounded-lg transition-colors ${
                            answers[currentQuestion.id] === option
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                                answers[currentQuestion.id] === option
                                  ? 'border-primary bg-primary'
                                  : 'border-gray-300'
                              }`}
                            >
                              {answers[currentQuestion.id] === option && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </div>
                            <span>{option}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <Button
                variant="outline"
                onClick={() => toggleMarkForReview(currentQuestion.id)}
              >
                <Flag
                  className={`w-4 h-4 mr-2 ${
                    markedForReview.has(currentQuestion.id) ? 'fill-current' : ''
                  }`}
                />
                {markedForReview.has(currentQuestion.id) ? 'Unmark' : 'Mark for Review'}
              </Button>

              <Button
                onClick={() =>
                  setCurrentQuestion(Math.min(test.questions.length - 1, currentQuestionIndex + 1))
                }
                disabled={currentQuestionIndex === test.questions.length - 1}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Question Palette */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-4">
                <h3 className="font-medium mb-4">Question Palette</h3>
                
                <div className="space-y-4 mb-4">
                  <div className="flex items-center text-sm">
                    <div className="w-6 h-6 bg-primary rounded mr-2" />
                    <span>Answered ({answeredCount})</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-6 h-6 bg-yellow-400 rounded mr-2" />
                    <span>Marked ({markedCount})</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="w-6 h-6 bg-gray-200 rounded mr-2" />
                    <span>Not Visited</span>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {test.questions.map((q: any, index: number) => {
                    const isAnswered = answers[q.id] !== undefined
                    const isMarked = markedForReview.has(q.id)
                    const isCurrent = index === currentQuestionIndex
                    
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestion(index)}
                        className={`w-10 h-10 rounded flex items-center justify-center text-sm font-medium ${
                          isCurrent
                            ? 'ring-2 ring-primary'
                            : ''
                        } ${
                          isAnswered
                            ? 'bg-primary text-white'
                            : isMarked
                            ? 'bg-yellow-400 text-white'
                            : 'bg-gray-200'
                        }`}
                      >
                        {index + 1}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
