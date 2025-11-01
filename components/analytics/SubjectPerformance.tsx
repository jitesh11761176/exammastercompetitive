'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SubjectData {
  subject: string
  accuracy: number
  attempted: number
  correct: number
}

interface SubjectPerformanceProps {
  data: SubjectData[]
}

const getColor = (accuracy: number) => {
  if (accuracy >= 80) return '#10B981' // Green
  if (accuracy >= 60) return '#F59E0B' // Amber
  if (accuracy >= 40) return '#F97316' // Orange
  return '#EF4444' // Red
}

export function SubjectPerformance({ data }: SubjectPerformanceProps) {
  const sortedData = [...data].sort((a, b) => b.accuracy - a.accuracy)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject-wise Performance</CardTitle>
        <CardDescription>Your accuracy across different subjects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>Excellent (80%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500"></div>
            <span>Good (60-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span>Average (40-60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span>Needs Work (&lt;40%)</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={sortedData} layout="vertical" margin={{ left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: 'currentColor' }} />
            <YAxis
              type="category"
              dataKey="subject"
              tick={{ fill: 'currentColor' }}
              width={90}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value: number, _name: string, props: any) => [
                `${value.toFixed(1)}% (${props.payload.correct}/${props.payload.attempted})`,
                'Accuracy',
              ]}
            />
            <Bar dataKey="accuracy" radius={[0, 8, 8, 0]}>
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.accuracy)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Top and Bottom Subjects */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold mb-2 text-green-700 dark:text-green-400">
              Top Subjects
            </h4>
            <div className="space-y-2">
              {sortedData.slice(0, 3).map((subject, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{subject.subject}</span>
                  <span className="font-semibold text-green-600">
                    {subject.accuracy.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2 text-red-700 dark:text-red-400">
              Needs Improvement
            </h4>
            <div className="space-y-2">
              {sortedData.slice(-3).reverse().map((subject, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{subject.subject}</span>
                  <span className="font-semibold text-red-600">
                    {subject.accuracy.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
