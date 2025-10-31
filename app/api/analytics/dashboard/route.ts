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

    // Get user progress
    const userProgress = await prisma.userProgress.findMany({
      where: { userId: session.user.id },
      include: {
        topic: {
          select: {
            id: true,
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

    // Calculate overview stats
    const totalTests = analytics?.totalTestsAttempted || 0
    const totalQuestions =
      userProgress.reduce((sum, p) => sum + p.totalQuestions, 0)
    const overallAccuracy = analytics?.overallAccuracy || 0
    const currentStreak = gamification?.currentStreak || 0
    const totalPoints = gamification?.totalPoints || 0

    // Calculate study time (in hours) - estimate based on test attempts
    const studyTime = recentTests.reduce(
      (sum, attempt) => sum + (attempt.timeTaken || 0),
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
      recentTests: recentTests.map((attempt) => ({
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
        endTime: attempt.completedAt,
        pointsEarned: attempt.pointsEarned,
      })),
      userProgress: userProgress.map((progress) => ({
        topicId: progress.topic.id,
        topicName: progress.topic.name,
        subjectId: progress.topic.subject.id,
        subjectName: progress.topic.subject.name,
        totalQuestions: progress.totalQuestions,
        correctAnswers: progress.correctAnswers,
        accuracy: progress.accuracy,
        lastPracticed: progress.lastPracticed,
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
