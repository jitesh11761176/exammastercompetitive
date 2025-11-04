import { NextRequest, NextResponse } from 'next/server'

// GET /api/test-series - List all test series
// NOTE: This feature is deprecated. The TestSeries model has been removed.
// Use /api/courses to browse available courses and their categories.
export async function GET(_req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Test series are not supported. This feature has been deprecated.',
      message: 'Please use /api/courses to browse available content.',
      series: []
    },
    { status: 501 } // 501 Not Implemented
  )
}

// POST /api/test-series - Create new test series (Admin only)
// NOTE: This feature is deprecated. The TestSeries model has been removed.
// Use /api/admin/courses and /api/admin/categories instead.
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Creating test series is not supported. This feature has been deprecated.',
      message: 'Please use /api/admin/courses and /api/admin/categories to create content.'
    },
    { status: 501 } // 501 Not Implemented
  )
}
