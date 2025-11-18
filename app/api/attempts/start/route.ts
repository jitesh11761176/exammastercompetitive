import { NextRequest, NextResponse } from 'next/server'
// PRISMA MIGRATION: This endpoint requires Firebase migration and is currently disabled
// Removed unused imports: getServerSession, authOptions

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint requires Firebase migration and is currently disabled' },
    { status: 503 }
  )
}

// DISABLED - REQUIRES FIREBASE MIGRATION
/*
export async function POST_DISABLED(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { testId } = await request.json()

    const user = await FIREBASE_TODO.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const attempt = await prisma.testAttempt.create({
      data: {
        userId: user.id,
        testId,
        startTime: new Date(),
        status: 'IN_PROGRESS',
        answers: {},
        totalMarks: 0,
      }
    })

    return NextResponse.json(attempt)
  } catch (error) {
    console.error('Error starting attempt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
*/
