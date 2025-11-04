import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import EnrollmentButton from '@/components/test-series/EnrollmentButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BookOpen, Clock, CheckCircle, IndianRupee } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function getTestSeries(slug: string, examId: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'
    const res = await fetch(
      `${baseUrl}/api/test-series/${slug}?examId=${examId}`,
      {
        cache: 'no-store',
      }
    )

    if (!res.ok) {
      return null
    }

    return res.json()
  } catch (error) {
    console.error('Error fetching test series:', error)
    return null
  }
}

export async function generateMetadata({ params, searchParams }: any): Promise<Metadata> {
  const series = await getTestSeries(params.slug, searchParams.examId)

  if (!series) {
    return {
      title: 'Test Series Not Found',
    }
  }

  return {
    title: `${series.title} | ExamMaster Pro`,
    description: series.description || `Complete test series for ${series.exam.name}`,
  }
}

export default async function TestSeriesDetailsPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { examId: string }
}) {
  const session = await getServerSession(authOptions)
  const series = await getTestSeries(params.slug, searchParams.examId)

  if (!series) {
    notFound()
  }

  const displayPrice = series.discountPrice || series.price
  const hasDiscount = series.discountPrice && series.discountPrice < series.price

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary">{series.exam.category.name}</Badge>
          <Badge variant="outline">{series.exam.name}</Badge>
        </div>
        <h1 className="text-4xl font-bold mb-4">{series.title}</h1>
        <p className="text-muted-foreground text-lg">
          {series.description || `Complete test series for ${series.exam.name}`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tests List */}
          <Card>
            <CardHeader>
              <CardTitle>Tests Included ({series.tests?.length || 0})</CardTitle>
              <CardDescription>
                Complete all tests to master {series.exam.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {series.tests && series.tests.length > 0 ? (
                <div className="space-y-4">
                  {series.tests.map((test: any, index: number) => (
                    <div
                      key={test.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <h3 className="font-semibold">{test.title}</h3>
                          {test.isLocked && (
                            <Badge variant="secondary">Locked</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {test.totalQuestions} Questions
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {test.duration} mins
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {test.difficulty}
                          </Badge>
                        </div>
                      </div>
                      {series.isEnrolled && !test.isLocked && (
                        <Link href={`/test/${test.id}`}>
                          <Button variant="outline" size="sm">
                            Start Test
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Tests will be added soon
                </p>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          {series.features && series.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>What You&apos;ll Get</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {series.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Enrollment Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                {series.isFree ? (
                  <Badge className="text-lg px-4 py-2 bg-green-500">
                    Free
                  </Badge>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <div className="flex items-center text-3xl font-bold">
                        <IndianRupee className="w-6 h-6" />
                        {displayPrice.toLocaleString()}
                      </div>
                      {hasDiscount && (
                        <div className="flex items-center text-lg text-muted-foreground line-through">
                          <IndianRupee className="w-4 h-4" />
                          {series.price.toLocaleString()}
                        </div>
                      )}
                    </div>
                    {hasDiscount && (
                      <p className="text-sm text-green-600 mt-1">
                        Save ₹{(series.price - displayPrice).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {session?.user ? (
                <EnrollmentButton
                  seriesId={series.id}
                  examId={series.examId}
                  slug={params.slug}
                  isEnrolled={series.isEnrolled}
                  isFree={series.isFree}
                  price={displayPrice}
                />
              ) : (
                <Link href="/login">
                  <Button className="w-full">Login to Enroll</Button>
                </Link>
              )}

              <Separator />

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Tests</span>
                  <span className="font-semibold">{series.totalTests}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Questions</span>
                  <span className="font-semibold">
                    {series.totalQuestions}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Validity</span>
                  <span className="font-semibold">
                    {series.validityDays} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Students</span>
                  <span className="font-semibold">
                    {series.enrolledCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enrollment Details (if enrolled) */}
          {series.isEnrolled && series.enrollmentDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Enrolled On</span>
                  <span className="font-semibold">
                    {new Date(
                      series.enrollmentDetails.enrolledAt
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expires On</span>
                  <span className="font-semibold">
                    {new Date(
                      series.enrollmentDetails.expiresAt
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Tests Completed
                  </span>
                  <span className="font-semibold">
                    {series.enrollmentDetails.completedTests} /{' '}
                    {series.totalTests}
                  </span>
                </div>
                {series.enrollmentDetails.averageScore > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Avg Score</span>
                    <span className="font-semibold">
                      {series.enrollmentDetails.averageScore.toFixed(1)}%
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
