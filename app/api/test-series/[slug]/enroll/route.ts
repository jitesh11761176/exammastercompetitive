import { NextRequest, NextResponse } from 'next/server'

// POST /api/test-series/[slug]/enroll - Enroll in a test series
// NOTE: This feature is deprecated. The TestSeries and Enrollment models have been removed.
// Use CourseEnrollment (/api/courses/[courseId]/enroll) instead.
export async function POST(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return NextResponse.json(
    { 
      error: 'Test series enrollments are not supported. This feature has been deprecated.',
      message: 'Please use course enrollment instead. Visit /courses to browse available courses.',
      slug: params.slug
    },
    { status: 501 } // 501 Not Implemented
  )
}
