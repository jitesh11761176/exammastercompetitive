import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user progress grouped by subject
    const userProgress = await prisma.userProgress.findMany({
      where: { userId: session.user.id },
      include: {
        topic: {
          select: {
            name: true,
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Group by subject
    const subjectMap = new Map<
      string,
      {
        subjectId: string
        subject: string
        totalQuestions: number
        correctAnswers: number
        topics: Array<{
          topicId: string
          topicName: string
          accuracy: number
          totalQuestions: number
          correctAnswers: number
        }>
      }
    >()

    userProgress.forEach((progress) => {
      const subjectId = progress.topic.subject.id
      const subjectName = progress.topic.subject.name

      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subjectId,
          subject: subjectName,
          totalQuestions: 0,
          correctAnswers: 0,
          topics: [],
        })
      }

      const subjectData = subjectMap.get(subjectId)!
      subjectData.totalQuestions += progress.totalQuestions
      subjectData.correctAnswers += progress.correctAnswers
      subjectData.topics.push({
        topicId: progress.topic.id,
        topicName: progress.topic.name,
        accuracy: progress.accuracy,
        totalQuestions: progress.totalQuestions,
        correctAnswers: progress.correctAnswers,
      })
    })

    // Calculate subject-wise data
    const subjectPerformance = Array.from(subjectMap.values()).map(
      (subject) => ({
        subject: subject.subject,
        subjectId: subject.subjectId,
        accuracy:
          subject.totalQuestions > 0
            ? (subject.correctAnswers / subject.totalQuestions) * 100
            : 0,
        attempted: subject.totalQuestions,
        correct: subject.correctAnswers,
        topics: subject.topics.sort((a, b) => b.accuracy - a.accuracy),
      })
    )

    // Calculate time distribution (estimated)
    const timeDistribution = subjectPerformance.map((subject) => ({
      name: subject.subject,
      value: subject.attempted * 1.5, // Estimate: 1.5 minutes per question
      color: getSubjectColor(subject.subject),
    }))

    // Calculate difficulty-wise accuracy
    const testAttempts = await prisma.testAttempt.findMany({
      where: {
        userId: session.user.id,
        status: 'COMPLETED',
      },
      include: {
        test: {
          select: {
            difficulty: true,
          },
        },
      },
    })

    const difficultyMap = new Map<
      string,
      { total: number; correct: number; attempted: number }
    >()

    testAttempts.forEach((attempt) => {
      const difficulty = attempt.test.difficulty
      if (!difficultyMap.has(difficulty)) {
        difficultyMap.set(difficulty, { total: 0, correct: 0, attempted: 0 })
      }
      const data = difficultyMap.get(difficulty)!
      data.total += (attempt.correctAnswers || 0) + (attempt.wrongAnswers || 0)
      data.correct += attempt.correctAnswers || 0
      data.attempted++
    })

    const difficultyAnalysis = Array.from(difficultyMap.entries()).map(
      ([difficulty, data]) => ({
        name: difficulty,
        value: data.total > 0 ? (data.correct / data.total) * 100 : 0,
        color: getDifficultyColor(difficulty),
        attempted: data.attempted,
      })
    )

    return NextResponse.json({
      subjectPerformance,
      timeDistribution,
      difficultyAnalysis,
    })
  } catch (error) {
    console.error('Error fetching subject analysis:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subject analysis' },
      { status: 500 }
    )
  }
}

function getSubjectColor(subject: string): string {
  const colors: Record<string, string> = {
    Mathematics: '#4F46E5',
    'Quantitative Aptitude': '#7C3AED',
    English: '#10B981',
    'General Knowledge': '#F59E0B',
    Reasoning: '#EF4444',
    'General Awareness': '#EC4899',
    Science: '#06B6D4',
    'Computer Science': '#8B5CF6',
  }
  return colors[subject] || '#6B7280'
}

function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    EASY: '#10B981',
    MEDIUM: '#F59E0B',
    HARD: '#EF4444',
  }
  return colors[difficulty] || '#6B7280'
}
