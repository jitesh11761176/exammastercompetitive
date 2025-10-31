'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface PerformanceData {
  date: string
  score: number | null
  average?: number
  testsCount?: number
}

interface PerformanceChartProps {
  data: PerformanceData[]
  showAverage?: boolean
}

export function PerformanceChart({ data, showAverage = true }: PerformanceChartProps) {
  // Find best and worst performing days (excluding null scores)
  const validData = data.filter(item => item.score !== null)
  const bestDay = validData.length > 0 ? validData.reduce((max, item) => ((item.score ?? 0) > (max.score ?? 0) ? item : max), validData[0]) : null
  const worstDay = validData.length > 0 ? validData.reduce((min, item) => ((item.score ?? 0) < (min.score ?? 0) ? item : min), validData[0]) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Trend</CardTitle>
        <CardDescription>Your score progression over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-gray-600 dark:text-gray-400">Your Score</span>
          </div>
          {showAverage && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Platform Average</span>
            </div>
          )}
          <div className="ml-auto flex gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-500">Best Day</div>
              <div className="font-semibold text-green-600">
                {bestDay?.score?.toFixed(1) ?? 'N/A'}% ({bestDay?.date ?? '-'})
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Worst Day</div>
              <div className="font-semibold text-red-600">
                              <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                {worstDay?.score?.toFixed(1) ?? 'N/A'}% ({worstDay?.date ?? '-'})
              </span>
              </div>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickLine={{ stroke: 'currentColor' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickLine={{ stroke: 'currentColor' }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#4F46E5"
              strokeWidth={3}
              fill="url(#colorScore)"
              dot={{ fill: '#4F46E5', r: 4 }}
              activeDot={{ r: 6 }}
            />
            {showAverage && (
              <Line
                type="monotone"
                dataKey="average"
                stroke="#10B981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
