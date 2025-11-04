import { NextRequest, NextResponse } from 'next/server'

// GET /api/pyq - List all PYQ collections
// NOTE: This feature is deprecated. The PYQCollection model has been removed.
// Previous Year Questions are not currently supported in the new schema.
export async function GET(_req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Previous Year Questions collections are not available. This feature has been deprecated.',
      collections: []
    },
    { status: 501 } // 501 Not Implemented
  )
}

// POST /api/pyq - Create new PYQ collection (Admin only)
// NOTE: This feature is deprecated. The PYQCollection model has been removed.
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: 'Creating PYQ collections is not supported. This feature has been deprecated.' },
    { status: 501 } // 501 Not Implemented
  )
}
