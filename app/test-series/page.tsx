import { Suspense } from 'react'
import { Metadata } from 'next'
import TestSeriesCard from '@/components/test-series/TestSeriesCard'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Test Series | ExamMaster Pro',
  description: 'Comprehensive test series for all competitive exams',
}

async function getTestSeries() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'
    const res = await fetch(`${baseUrl}/api/test-series`, {
      cache: 'no-store',
    })
    
    if (!res.ok) {
      throw new Error('Failed to fetch test series')
    }
    
    return res.json()
  } catch (error) {
    console.error('Error fetching test series:', error)
    return []
  }
}

function TestSeriesListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="h-[400px]">
          <CardContent className="p-6">
            <Skeleton className="h-40 w-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function TestSeriesList() {
  const testSeries = await getTestSeries()

  if (testSeries.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <h3 className="text-2xl font-semibold mb-2">No test series available</h3>
          <p className="text-muted-foreground">
            Check back later for new test series
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testSeries.map((series: any) => (
        <TestSeriesCard key={series.id} series={series} />
      ))}
    </div>
  )
}

export default function TestSeriesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Test Series</h1>
        <p className="text-muted-foreground text-lg">
          Comprehensive test series for all competitive exams
        </p>
      </div>

      <Suspense fallback={<TestSeriesListSkeleton />}>
        <TestSeriesList />
      </Suspense>
    </div>
  )
}
