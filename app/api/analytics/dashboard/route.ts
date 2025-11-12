import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
// PRISMA MIGRATION: import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get analytics data
    const analytics = await prisma.analytics.findUnique({
      where: { userId: session.user.id },
    })

    // Get gamification data
    const gamification = await prisma.gamification.findUnique({
      where: { userId: session.user.id },
    })

    // Get recent test attempts
    const recentTests = await prisma.testAttempt.findMany({
      where: {
        userId: session.user.id,
        status: 'COMPLETED',
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            difficulty: true,
          },
        },
      },
      orderBy: { endTime: 'desc' },
      take: 10,
    })

    // Get user progress rows (per-question attempts) with topic/subject via question
    const progressRows = await prisma.userProgress.findMany({
      where: { userId: session.user.id },
      include: {
        question: {
          include: {
            topic: {
              include: { subject: true },
            },
          },
        },
      },
      orderBy: { attemptedAt: 'desc' },
      take: 1000, // limit for safety
    })

    // Aggregate progress by topic
    type Agg = {
      topicId: string
      topicName: string
      subjectId: string
      subjectName: string
      totalQuestions: number
      correctAnswers: number
      accuracy: number
      lastPracticed: Date | null
    }

    const progressByTopic = new Map<string, Agg>()
    for (const row of progressRows as any[]) {
      const topic = row.question?.topic
      if (!topic) continue
      const key = topic.id
      const existing = progressByTopic.get(key)
      const updated: Agg = existing ?? {
        topicId: topic.id,
        topicName: topic.name,
        subjectId: topic.subject?.id ?? '',
        subjectName: topic.subject?.name ?? '',
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        lastPracticed: null,
      }
      updated.totalQuestions += 1
      if (row.isCorrect) updated.correctAnswers += 1
      // Update last practiced
      const ts = row.attemptedAt ? new Date(row.attemptedAt) : null
      if (ts && (!updated.lastPracticed || ts > updated.lastPracticed)) {
        updated.lastPracticed = ts
      }
      progressByTopic.set(key, updated)
    }
    // Compute accuracy per topic
    const userProgressAgg: Agg[] = Array.from(progressByTopic.values()).map((p) => ({
      ...p,
      accuracy: p.totalQuestions > 0 ? Math.round((p.correctAnswers / p.totalQuestions) * 1000) / 10 : 0,
    }))

    // Calculate overview stats
    const totalTests = analytics?.totalTestsAttempted || 0
    const totalQuestions =
      userProgressAgg.reduce((sum: number, p: any) => sum + p.totalQuestions, 0)
    const overallAccuracy = analytics?.overallAccuracy || 0
  const currentStreak = gamification?.dailyStreak || 0
    const totalPoints = gamification?.totalPoints || 0

    // Calculate study time (in hours) - estimate based on test attempts
    const studyTime = recentTests.reduce(
      (sum: number, attempt: any) => sum + (attempt.timeTaken || 0),
      0
    ) / 3600 // Convert seconds to hours

    // Get current rank
    const allUsers = await prisma.gamification.count()
    const betterUsers = await prisma.gamification.count({
      where: {
        totalPoints: {
          gt: totalPoints,
        },
      },
    })
    const currentRank = betterUsers + 1

    return NextResponse.json({
      overview: {
        totalTests,
        totalQuestions,
        overallAccuracy,
        currentStreak,
        studyTime: studyTime.toFixed(1),
        currentRank,
        totalUsers: allUsers,
      },
      recentTests: recentTests.map((attempt: any) => ({
        id: attempt.id,
        testId: attempt.test.id,
        testTitle: attempt.test.title,
        difficulty: attempt.test.difficulty,
        score: attempt.score,
        percentage: attempt.accuracy,
        correctAnswers: attempt.correctAnswers,
        wrongAnswers: attempt.wrongAnswers,
        skippedAnswers: attempt.skippedAnswers,
        timeTaken: attempt.timeTaken,
        endTime: attempt.endTime,
      })),
      userProgress: userProgressAgg.map((p) => ({
        topicId: p.topicId,
        topicName: p.topicName,
        subjectId: p.subjectId,
        subjectName: p.subjectName,
        totalQuestions: p.totalQuestions,
        correctAnswers: p.correctAnswers,
        accuracy: p.accuracy,
        lastPracticed: p.lastPracticed,
      })),
      analytics,
      gamification,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

