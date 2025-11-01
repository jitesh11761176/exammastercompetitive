import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const submitTestSchema = z.object({
  attemptId: z.string(),
  answers: z.record(z.string(), z.any()),
  timeTaken: z.number(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = submitTestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { attemptId, answers, timeTaken } = validation.data

    // Get attempt with test
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: true,
        user: true,
      },
    })

    if (!attempt || attempt.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Attempt not found or unauthorized' },
        { status: 404 }
      )
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Test already submitted' },
        { status: 400 }
      )
    }

    // Note: Detailed scoring is handled elsewhere in this implementation.
    // Here we mark the attempt as completed and persist answers/time.

    // Update attempt with results
    const completedAt = new Date()
    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        endTime: completedAt,
        status: 'COMPLETED',
        answers,
        timeTaken,
      },
    })
    

    // Calculate rank
    const betterAttempts = await prisma.testAttempt.count({
      where: {
        testId: params.id,
        status: 'COMPLETED',
        accuracy: {
          gt: updatedAttempt.accuracy || 0,
        },
      },
    })

    const rank = betterAttempts + 1

    return NextResponse.json({
      message: 'Test submitted successfully',
      attempt: updatedAttempt,
      results: {
        score: updatedAttempt.score,
        totalMarks: updatedAttempt.totalMarks,
        percentage: updatedAttempt.accuracy || 0,
        correctAnswers: updatedAttempt.correctAnswers,
        wrongAnswers: updatedAttempt.wrongAnswers,
        skippedAnswers: updatedAttempt.unattempted,
        timeTaken,
        rank,
        pointsEarned: 0,
        passed: false,
      },
    })
  } catch (error) {
    console.error('Error submitting test:', error)
    return NextResponse.json(
      { error: 'Failed to submit test' },
      { status: 500 }
    )
  }
}
