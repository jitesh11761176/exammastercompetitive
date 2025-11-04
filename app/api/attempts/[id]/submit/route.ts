import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateTestScore } from '@/lib/test-engine/scoring-engine'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

  const { answers } = await request.json()
    const attemptId = params.id

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    // Calculate basic timing
    const timeTaken = Math.floor((Date.now() - attempt!.startTime.getTime()) / 1000)

    // Fetch test to score answers
    const test = await prisma.test.findUnique({ where: { id: attempt!.testId } })
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Normalize answers to scoring format
    const answersArray = Object.entries(answers || {}).map(([questionId, value]: [string, any]) => {
      if (value && typeof value === 'object' && 'answer' in value) {
        return { questionId, answer: value.answer, timeTaken: value.timeSpent || 0 }
      }
      return { questionId, answer: value, timeTaken: 0 }
    })

    // Calculate scores
    const scoring = await calculateTestScore(answersArray, test)
    const accuracy = scoring.totalMarks > 0 ? (scoring.score / scoring.totalMarks) * 100 : 0

    // Update attempt
    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
        answers,
        timeTaken,
        score: scoring.score,
        totalMarks: scoring.totalMarks,
        accuracy,
        correctAnswers: scoring.correctAnswers,
        wrongAnswers: scoring.wrongAnswers,
        partialCorrect: scoring.partialCorrect,
        unattempted: scoring.unattempted,
        detailedReport: scoring.detailedReport,
      }
    })

    // Rank based on accuracy
    const betterAttempts = await prisma.testAttempt.count({
      where: {
        testId: attempt!.testId,
        status: 'COMPLETED',
        accuracy: { gt: updatedAttempt.accuracy || 0 },
      },
    })
    const rank = betterAttempts + 1
    await prisma.testAttempt.update({ where: { id: attemptId }, data: { rank } })

    return NextResponse.json({ ...updatedAttempt, rank })
  } catch (error) {
    console.error('Error submitting attempt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
