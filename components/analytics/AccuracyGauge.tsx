'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface AccuracyGaugeProps {
  accuracy: number
  label?: string
  data?: Array<{ name: string; value: number; color: string }>
  type?: 'gauge' | 'donut'
}

export function AccuracyGauge({
  accuracy,
  label = 'Overall Accuracy',
  data,
  type = 'gauge',
}: AccuracyGaugeProps) {
  if (type === 'donut' && data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{label}</CardTitle>
          <CardDescription>Distribution breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)}%`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
  }

  const getColor = () => {
    if (accuracy >= 80) return 'text-green-600'
    if (accuracy >= 60) return 'text-amber-600'
    if (accuracy >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getGradient = () => {
    if (accuracy >= 80) return 'from-green-500 to-emerald-600'
    if (accuracy >= 60) return 'from-amber-500 to-yellow-600'
    if (accuracy >= 40) return 'from-orange-500 to-red-500'
    return 'from-red-500 to-rose-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>Your current performance level</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8">
          {/* Circular Progress */}
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Progress circle */}
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="url(#gradient)"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - accuracy / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop
                    offset="0%"
                    className={accuracy >= 80 ? 'text-green-500' : accuracy >= 60 ? 'text-amber-500' : 'text-red-500'}
                    style={{ stopColor: 'currentColor' }}
                  />
                  <stop
                    offset="100%"
                    className={accuracy >= 80 ? 'text-emerald-600' : accuracy >= 60 ? 'text-yellow-600' : 'text-rose-600'}
                    style={{ stopColor: 'currentColor' }}
                  />
                </linearGradient>
              </defs>
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-bold ${getColor()}`}>
                {accuracy.toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500 mt-1">Accuracy</span>
            </div>
          </div>

          {/* Status bars */}
          <div className="w-full mt-8 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                <span className="font-semibold">{accuracy.toFixed(1)}%</span>
              </div>
              <Progress value={accuracy} className="h-2" />
            </div>

            {/* Performance level */}
            <div className="text-center mt-4">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${getGradient()} text-white font-semibold`}>
                {accuracy >= 80 ? '🏆 Excellent' : accuracy >= 60 ? '⭐ Good' : accuracy >= 40 ? '📈 Average' : '📚 Needs Work'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
