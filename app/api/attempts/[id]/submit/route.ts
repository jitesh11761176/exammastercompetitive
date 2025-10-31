import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
      include: {
        test: {
          include: {
            questions: true
          }
        }
      }
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    // Calculate score
    let correctAnswers = 0
    let wrongAnswers = 0
    let skippedAnswers = 0
    let totalScore = 0

    attempt.test.questions.forEach((question: any) => {
      const userAnswer = answers[question.id]
      
      if (!userAnswer) {
        skippedAnswers++
        return
      }

      const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer)
      
      if (isCorrect) {
        correctAnswers++
        totalScore += question.marks
      } else {
        wrongAnswers++
        totalScore -= question.negativeMarks
      }
    })

    const totalMarks = attempt.test.questions.reduce((sum: number, q: any) => sum + q.marks, 0)
    const percentage = (totalScore / totalMarks) * 100
    const timeTaken = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000)

    // Calculate points earned (based on percentage and difficulty)
    const difficultyMultiplier = {
      EASY: 1,
      MEDIUM: 1.5,
      HARD: 2
    }[attempt.test.difficulty] || 1

    const pointsEarned = Math.floor(percentage * difficultyMultiplier)

    // Update attempt
    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        answers,
        score: totalScore,
        percentage,
        correctAnswers,
        wrongAnswers,
        skippedAnswers,
        timeTaken,
        pointsEarned,
      }
    })

    // Update user points
    await prisma.user.update({
      where: { id: attempt.userId },
      data: {
        points: {
          increment: pointsEarned
        }
      }
    })

    return NextResponse.json(updatedAttempt)
  } catch (error) {
    console.error('Error submitting attempt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
