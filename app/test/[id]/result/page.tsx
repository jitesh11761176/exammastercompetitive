'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Trophy,
  Target,
  TrendingUp,
  Award,
  Share2,
  Download,
  RotateCcw,
  CheckCircle,
  XCircle,
  MinusCircle,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

export default function TestResultPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  
  const attemptId = searchParams.get('attemptId')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    if (!attemptId) return

    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch(`/api/attempts/${attemptId}`)
        if (!response.ok) throw new Error('Failed to fetch result')
        const data = await response.json()
        if (!cancelled) setResult(data)
      } catch (error) {
        console.error('Error fetching result:', error)
        toast.error('Failed to load results')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [attemptId])

  useEffect(() => {
    if (result) {
      setTimeout(() => setShowAnimation(true), 100)
    }
  }, [result])

  

  const shareResult = async () => {
    const text = `I scored ${result.percentage.toFixed(1)}% on ${result.test.title}! 🎉`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Test Result',
          text,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(text)
      toast.success('Result copied to clipboard!')
    }
  }

  const downloadPDF = () => {
    toast.info('PDF download feature coming soon!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Result not found</h2>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const accuracy = result.correctAnswers / (result.correctAnswers + result.wrongAnswers) * 100 || 0
  const isPassed = result.percentage >= result.test.passingScore

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-gray-950 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero Card */}
        <Card className={`${showAnimation ? 'animate-fade-in' : 'opacity-0'} text-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-emerald-500/10"></div>
          <CardContent className="pt-12 pb-8 relative z-10">
            <div className="mb-6">
              {isPassed ? (
                <Trophy className="w-20 h-20 mx-auto text-yellow-500 mb-4" />
              ) : (
                <Target className="w-20 h-20 mx-auto text-gray-400 mb-4" />
              )}
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {isPassed ? 'Congratulations! 🎉' : 'Good Effort! 💪'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {result.test.title}
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="text-center">
                <div className={`text-5xl md:text-6xl font-bold ${
                  isPassed ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {result.percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500 mt-1">Score</div>
              </div>
              <div className="h-16 w-px bg-gray-200 dark:bg-gray-700"></div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">
                  #{result.rank || 'N/A'}
                </div>
                <div className="text-sm text-gray-500 mt-1">Rank</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Badge className="px-4 py-2 text-base bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-2" />
                {result.correctAnswers} Correct
              </Badge>
              <Badge className="px-4 py-2 text-base bg-red-100 text-red-800">
                <XCircle className="w-4 h-4 mr-2" />
                {result.wrongAnswers} Wrong
              </Badge>
              <Badge className="px-4 py-2 text-base bg-gray-100 text-gray-800">
                <MinusCircle className="w-4 h-4 mr-2" />
                {result.skippedAnswers} Skipped
              </Badge>
              <Badge className="px-4 py-2 text-base bg-purple-100 text-purple-800">
                <Award className="w-4 h-4 mr-2" />
                +{result.pointsEarned} XP
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Marks Obtained</span>
                  <span className="font-semibold">{result.score.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Marks</span>
                  <span className="font-semibold">{result.totalMarks}</span>
                </div>
                <Progress value={result.percentage} className="h-2" />
                <div className="text-center text-sm text-gray-500">
                  {result.percentage.toFixed(1)}% of total
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Attempted</span>
                  <span className="font-semibold">
                    {result.correctAnswers + result.wrongAnswers}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Correct</span>
                  <span className="font-semibold text-green-600">{result.correctAnswers}</span>
                </div>
                <Progress value={accuracy} className="h-2" />
                <div className="text-center text-sm text-gray-500">
                  {accuracy.toFixed(1)}% accuracy
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Time Taken</span>
                  <span className="font-semibold">
                    {Math.floor(result.timeTaken / 60)} min
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Time</span>
                  <span className="font-semibold">{result.test.duration} min</span>
                </div>
                <Progress
                  value={(result.timeTaken / (result.test.duration * 60)) * 100}
                  className="h-2"
                />
                <div className="text-center text-sm text-gray-500">
                  {((result.timeTaken / (result.test.duration * 60)) * 100).toFixed(1)}% used
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question-wise Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Question Analysis</CardTitle>
            <CardDescription>Detailed breakdown of your performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {Object.entries(result.answers || {}).map(([questionId, answer]: [string, any], index) => (
                <div
                  key={questionId}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">Question {index + 1}</div>
                      <div className="text-xs text-gray-500">
                        {answer.markedForReview && (
                          <Badge variant="outline" className="mr-2">Marked</Badge>
                        )}
                        Time: {answer.timeSpent || 0}s
                      </div>
                    </div>
                  </div>
                  <div>
                    {answer.answer ? (
                      <Badge className="bg-green-100 text-green-800">Answered</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">Skipped</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button onClick={shareResult} variant="outline" className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Share Result
              </Button>
              <Button onClick={downloadPDF} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Link href={`/tests/${params.id}`} className="w-full">
                <Button variant="outline" className="w-full">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reattempt Test
                </Button>
              </Link>
              <Link href="/dashboard" className="w-full">
                <Button className="w-full">
                  Dashboard
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {result.percentage < 50 && (
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-600 mt-0.5" />
                  <span>Focus on understanding basic concepts before attempting more tests.</span>
                </li>
              )}
              {accuracy < 70 && (
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-600 mt-0.5" />
                  <span>Review your mistakes to improve accuracy in future attempts.</span>
                </li>
              )}
              {result.skippedAnswers > 5 && (
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-600 mt-0.5" />
                  <span>Work on time management to attempt all questions.</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-indigo-600 mt-0.5" />
                <span>Practice similar tests regularly to improve your performance.</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-indigo-600 mt-0.5" />
                <span>Check your analytics to identify weak areas and focus on them.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
