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

    // Get per-question progress with topic/subject via question
    const progressRows = await prisma.userProgress.findMany({
      where: { userId: session.user.id },
      include: {
        question: {
          include: {
            topic: { include: { subject: true } },
          },
        },
      },
      orderBy: { attemptedAt: 'desc' },
      take: 2000,
    })

    // Aggregate per topic
    type TopicAgg = {
      topicId: string
      topicName: string
      subjectId: string
      subjectName: string
      totalQuestions: number
      correctAnswers: number
      accuracy: number
    }

    const byTopic = new Map<string, TopicAgg>()
    for (const row of progressRows as any[]) {
      const topic = row.question?.topic
      if (!topic) continue
      const key = topic.id
      const ex = byTopic.get(key)
      const agg: TopicAgg = ex ?? {
        topicId: topic.id,
        topicName: topic.name,
        subjectId: topic.subject?.id ?? '',
        subjectName: topic.subject?.name ?? '',
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
      }
      agg.totalQuestions += 1
      if (row.isCorrect) agg.correctAnswers += 1
      byTopic.set(key, agg)
    }
    const topicsAgg: TopicAgg[] = Array.from(byTopic.values()).map((t) => ({
      ...t,
      accuracy: t.totalQuestions > 0 ? (t.correctAnswers / t.totalQuestions) * 100 : 0,
    }))

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

    topicsAgg.forEach((progress) => {
      const subjectId = progress.subjectId
      const subjectName = progress.subjectName

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
        topicId: progress.topicId,
        topicName: progress.topicName,
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

  testAttempts.forEach((attempt: any) => {
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
