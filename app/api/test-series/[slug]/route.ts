import { NextRequest, NextResponse } from 'next/server'

// GET /api/test-series/[slug] - Get single test series details
// NOTE: This feature is deprecated. The TestSeries model has been removed.
// Use /api/courses or /api/categories endpoints instead.
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return NextResponse.json(
    { 
      error: 'Test series are not supported. This feature has been deprecated.',
      message: 'Please use courses and categories instead. Visit /courses to browse available content.',
      slug: params.slug
    },
    { status: 501 } // 501 Not Implemented
  )
}

// PUT /api/test-series/[slug] - Update test series (Admin only)
// NOTE: This feature is deprecated. The TestSeries model has been removed.
export async function PUT(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return NextResponse.json(
    { 
      error: 'Updating test series is not supported. This feature has been deprecated.',
      slug: params.slug
    },
    { status: 501 } // 501 Not Implemented
  )
}

// DELETE /api/test-series/[slug] - Delete test series (Admin only)
// NOTE: This feature is deprecated. The TestSeries model has been removed.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return NextResponse.json(
    { 
      error: 'Deleting test series is not supported. This feature has been deprecated.',
      slug: params.slug
    },
    { status: 501 } // 501 Not Implemented
  )
}
