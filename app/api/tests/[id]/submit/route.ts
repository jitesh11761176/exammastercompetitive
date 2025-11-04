import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { calculateTestScore } from '@/lib/test-engine/scoring-engine'

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

    // Convert answers object to array format for scoring engine
    const answersArray = Object.entries(answers).map(([questionId, answerData]: [string, any]) => ({
      questionId,
      answer: answerData.answer,
      timeTaken: answerData.timeSpent || 0,
    }))

    // Calculate scores
    const scoringResult = await calculateTestScore(answersArray, attempt.test)

    // Calculate accuracy percentage
    const accuracy = scoringResult.totalMarks > 0 
      ? (scoringResult.score / scoringResult.totalMarks) * 100 
      : 0

    // Update attempt with results
    const completedAt = new Date()
    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        endTime: completedAt,
        status: 'COMPLETED',
        answers,
        timeTaken,
        score: scoringResult.score,
        totalMarks: scoringResult.totalMarks,
        accuracy,
        correctAnswers: scoringResult.correctAnswers,
        wrongAnswers: scoringResult.wrongAnswers,
        partialCorrect: scoringResult.partialCorrect,
        unattempted: scoringResult.unattempted,
        detailedReport: scoringResult.detailedReport,
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

    // Update rank
    await prisma.testAttempt.update({
      where: { id: attemptId },
      data: { rank },
    })

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
        pointsEarned: Math.floor(updatedAttempt.score || 0),
        passed: (updatedAttempt.score || 0) >= (attempt.test.passingMarks || 0),
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
