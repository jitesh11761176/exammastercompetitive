import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const testId = params.id

    // Check if test exists
    const test = await prisma.test.findUnique({
      where: { id: testId },
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Check for existing incomplete attempt
    const existingAttempt = await prisma.testAttempt.findFirst({
      where: {
        userId: session.user.id,
        testId: testId,
        status: 'IN_PROGRESS',
      },
    })

    if (existingAttempt) {
      return NextResponse.json({
        message: 'Resuming existing attempt',
        attempt: existingAttempt,
      })
    }

    // Create new attempt
    const attempt = await prisma.testAttempt.create({
      data: {
        userId: session.user.id,
        testId: testId,
        startTime: new Date(),
        status: 'IN_PROGRESS',
        answers: {},
        totalMarks: test.totalMarks,
      },
    })

    return NextResponse.json({
      message: 'Test started successfully',
      attempt,
    })
  } catch (error) {
    console.error('Error starting test:', error)
    return NextResponse.json(
      { error: 'Failed to start test' },
      { status: 500 }
    )
  }
}
