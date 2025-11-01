'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react'

interface Topic {
  id: string
  name: string
  accuracy: number
  totalQuestions: number
  correctAnswers: number
  category: 'strength' | 'weakness' | 'improving' | 'declining'
}

interface StrengthWeaknessProps {
  topics: Topic[]
}

export function StrengthWeakness({ topics }: StrengthWeaknessProps) {
  const strengths = topics.filter((t) => t.category === 'strength')
  const weaknesses = topics.filter((t) => t.category === 'weakness')
  const improving = topics.filter((t) => t.category === 'improving')
  const declining = topics.filter((t) => t.category === 'declining')

  const TopicCard = ({ topic }: { topic: Topic }) => {
    const getIcon = () => {
      switch (topic.category) {
        case 'strength':
          return <Target className="w-5 h-5 text-green-600" />
        case 'weakness':
          return <AlertCircle className="w-5 h-5 text-red-600" />
        case 'improving':
          return <TrendingUp className="w-5 h-5 text-blue-600" />
        case 'declining':
          return <TrendingDown className="w-5 h-5 text-orange-600" />
      }
    }

    const getBadgeColor = () => {
      switch (topic.category) {
        case 'strength':
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        case 'weakness':
          return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        case 'improving':
          return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        case 'declining':
          return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      }
    }

    return (
      <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <div className="font-medium text-sm">{topic.name}</div>
            <div className="text-xs text-gray-500">
              {topic.correctAnswers}/{topic.totalQuestions} correct
            </div>
          </div>
        </div>
        <Badge className={`${getBadgeColor()} font-semibold`}>
          {topic.accuracy.toFixed(1)}%
        </Badge>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Strengths */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Target className="w-5 h-5" />
            Your Strengths
          </CardTitle>
          <CardDescription>Topics where you excel (80%+ accuracy)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {strengths.length > 0 ? (
            strengths.map((topic) => <TopicCard key={topic.id} topic={topic} />)
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Keep practicing to build your strengths!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weaknesses */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            Areas for Improvement
          </CardTitle>
          <CardDescription>Topics needing more practice (&lt;60% accuracy)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {weaknesses.length > 0 ? (
            weaknesses.map((topic) => <TopicCard key={topic.id} topic={topic} />)
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Great! No weak areas identified.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Improving Topics */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <TrendingUp className="w-5 h-5" />
            Improving Topics
          </CardTitle>
          <CardDescription>Your progress is trending upward</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {improving.length > 0 ? (
            improving.map((topic) => <TopicCard key={topic.id} topic={topic} />)
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Start practicing to see improvements!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Declining Topics */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <TrendingDown className="w-5 h-5" />
            Needs Attention
          </CardTitle>
          <CardDescription>Performance declining - needs review</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {declining.length > 0 ? (
            declining.map((topic) => <TopicCard key={topic.id} topic={topic} />)
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">All topics are stable or improving!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
