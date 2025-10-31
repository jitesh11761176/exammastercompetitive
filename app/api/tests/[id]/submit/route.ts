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

    // Get attempt with test and questions
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            questions: {
              select: {
                id: true,
                correctAnswer: true,
                marks: true,
                negativeMarks: true,
                difficulty: true,
                topicId: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            gamification: true,
          },
        },
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

    // Calculate results
    let correctAnswers = 0
    let wrongAnswers = 0
    let skippedAnswers = 0
    let totalMarks = 0
    let obtainedMarks = 0
    const topicPerformance: Record<string, { correct: number; total: number }> = {}

    attempt.test.questions.forEach((question) => {
      const userAnswer = answers[question.id]

      // Track topic performance
      if (question.topicId) {
        if (!topicPerformance[question.topicId]) {
          topicPerformance[question.topicId] = { correct: 0, total: 0 }
        }
        topicPerformance[question.topicId].total++
      }

      totalMarks += question.marks

      if (!userAnswer || !userAnswer.answer) {
        skippedAnswers++
        return
      }

      const isCorrect = Array.isArray(question.correctAnswer)
        ? JSON.stringify(question.correctAnswer.sort()) ===
          JSON.stringify(
            Array.isArray(userAnswer.answer)
              ? userAnswer.answer.sort()
              : [userAnswer.answer]
          )
        : question.correctAnswer === userAnswer.answer

      if (isCorrect) {
        correctAnswers++
        obtainedMarks += question.marks
        if (question.topicId) {
          topicPerformance[question.topicId].correct++
        }
      } else {
        wrongAnswers++
        obtainedMarks -= question.negativeMarks
      }
    })

    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0
    const passed = percentage >= attempt.test.passingScore

    // Calculate points earned
    const basePoints = Math.floor(obtainedMarks * 10)
    const difficultyMultiplier =
      attempt.test.difficulty === 'HARD' ? 2 : attempt.test.difficulty === 'MEDIUM' ? 1.5 : 1
    const accuracyBonus = percentage >= 90 ? 50 : percentage >= 75 ? 25 : 0
    const speedBonus =
      timeTaken < attempt.test.duration * 60 * 0.5 ? 30 : timeTaken < attempt.test.duration * 60 * 0.75 ? 15 : 0
    const pointsEarned = Math.floor(
      basePoints * difficultyMultiplier + accuracyBonus + speedBonus
    )

    // Update attempt with results
    const completedAt = new Date()
    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        completedAt,
        status: 'COMPLETED',
        answers,
        score: obtainedMarks,
        percentage,
        correctAnswers,
        wrongAnswers,
        skippedAnswers,
        timeTaken,
        pointsEarned,
      },
    })

    // Update user gamification
    if (attempt.user.gamification) {
      await prisma.gamification.update({
        where: { userId: session.user.id },
        data: {
          totalPoints: {
            increment: pointsEarned,
          },
          testsCompleted: {
            increment: 1,
          },
          lastActivityAt: new Date(),
        },
      })
    }

    // Update user progress for each topic
    for (const [topicId, performance] of Object.entries(topicPerformance)) {
      const accuracy = (performance.correct / performance.total) * 100

      await prisma.userProgress.upsert({
        where: {
          userId_topicId: {
            userId: session.user.id,
            topicId,
          },
        },
        create: {
          userId: session.user.id,
          topicId,
          totalQuestions: performance.total,
          correctAnswers: performance.correct,
          accuracy,
          lastPracticed: new Date(),
        },
        update: {
          totalQuestions: {
            increment: performance.total,
          },
          correctAnswers: {
            increment: performance.correct,
          },
          accuracy,
          lastPracticed: new Date(),
        },
      })
    }

    // Calculate rank
    const betterAttempts = await prisma.testAttempt.count({
      where: {
        testId: params.id,
        status: 'COMPLETED',
        percentage: {
          gt: percentage,
        },
      },
    })

    const rank = betterAttempts + 1

    return NextResponse.json({
      message: 'Test submitted successfully',
      attempt: updatedAttempt,
      results: {
        score: obtainedMarks,
        totalMarks,
        percentage,
        correctAnswers,
        wrongAnswers,
        skippedAnswers,
        timeTaken,
        rank,
        pointsEarned,
        passed,
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
