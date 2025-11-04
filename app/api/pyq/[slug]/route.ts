import { NextRequest, NextResponse } from 'next/server'

// GET /api/pyq/[slug] - Get single PYQ collection details
// NOTE: This feature is deprecated. The PYQCollection model has been removed.
// Previous Year Questions are not currently supported in the new schema.
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return NextResponse.json(
    { 
      error: 'Previous Year Questions collections are not available. This feature has been deprecated.',
      slug: params.slug
    },
    { status: 501 } // 501 Not Implemented
  )
}
