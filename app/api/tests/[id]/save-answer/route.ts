import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const saveAnswerSchema = z.object({
  attemptId: z.string(),
  questionId: z.string(),
  answer: z.union([z.string(), z.array(z.string())]),
  markedForReview: z.boolean().optional(),
  timeSpent: z.number().optional(),
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
    const validation = saveAnswerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { attemptId, questionId, answer, markedForReview, timeSpent } =
      validation.data

    // Verify attempt belongs to user
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    })

    if (!attempt || attempt.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Attempt not found or unauthorized' },
        { status: 404 }
      )
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Cannot modify completed test' },
        { status: 400 }
      )
    }

    // Update answers in the attempt
    const currentAnswers = (attempt.answers as any) || {}
    currentAnswers[questionId] = {
      answer,
      markedForReview: markedForReview || false,
      timeSpent: timeSpent || 0,
      answeredAt: new Date().toISOString(),
    }

    await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        answers: currentAnswers,
      },
    })

    return NextResponse.json({
      message: 'Answer saved successfully',
      questionId,
    })
  } catch (error) {
    console.error('Error saving answer:', error)
    return NextResponse.json(
      { error: 'Failed to save answer' },
      { status: 500 }
    )
  }
}
