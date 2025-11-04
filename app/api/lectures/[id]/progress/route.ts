import { NextRequest, NextResponse } from 'next/server'

// POST /api/lectures/[id]/progress - Update video progress
// NOTE: This feature is deprecated. The Lecture and VideoProgress models have been removed.
// Video courses are not currently supported in the new schema.
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { 
      error: 'Video lecture progress tracking is not available. This feature has been deprecated.',
      lectureId: params.id
    },
    { status: 501 } // 501 Not Implemented
  )
}

// GET /api/lectures/[id]/progress - Get video progress
// NOTE: This feature is deprecated. The Lecture and VideoProgress models have been removed.
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { 
      error: 'Video lecture progress tracking is not available. This feature has been deprecated.',
      lectureId: params.id,
      progress: null
    },
    { status: 501 } // 501 Not Implemented
  )
}
