import { prisma } from '@/lib/prisma'

// Spaced Repetition Algorithm (SM-2)
export function calculateNextReview(
  easeFactor: number,
  interval: number,
  performance: number // 0-5 scale: 0=complete blackout, 5=perfect
): { easeFactor: number; interval: number; nextReviewDate: Date } {
  // Update ease factor
  let newEaseFactor = easeFactor + (0.1 - (5 - performance) * (0.08 + (5 - performance) * 0.02))
  newEaseFactor = Math.max(1.3, newEaseFactor) // Minimum ease factor

  // Calculate next interval
  let newInterval: number
  if (performance < 3) {
    // Failed - reset interval
    newInterval = 1
  } else {
    if (interval === 0) {
      newInterval = 1
    } else if (interval === 1) {
      newInterval = 6
    } else {
      newInterval = Math.round(interval * newEaseFactor)
    }
  }

  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval)

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    nextReviewDate,
  }
}

// Get next best test recommendation
export async function getNextBestTest(userId: string) {
  // Get user's weak topics
  const analytics = await prisma.analytics.findUnique({
    where: { userId },
    select: {
      weakTopics: true,
      topicWiseAccuracy: true,
    },
  })

  // Get user's interested categories
  const interests = await prisma.userCategory.findMany({
    where: { userId },
    select: { categoryId: true },
  })

  const categoryIds = interests.map((i: any) => i.categoryId)

  // Get user's completed tests
  const completedTests = await prisma.testAttempt.findMany({
    where: {
      userId,
      status: 'COMPLETED',
    },
    select: { testId: true },
  })

  const completedTestIds = completedTests.map((t: any) => t.testId)

  // Find tests focusing on weak topics
  const recommendedTests = await prisma.test.findMany({
    where: {
      categoryId: { in: categoryIds },
      id: { notIn: completedTestIds },
      isActive: true,
    },
    include: {
      category: {
        select: { name: true },
      },
    },
    take: 10,
  })

  // Score each test
  const scoredTests = recommendedTests.map((test: any) => {
    let score = 0.5 // Base score

    // Higher score for topic-wise tests on weak topics
    if (test.testType === 'TOPIC_WISE' && analytics?.weakTopics) {
      score += 0.3
    }

    // Prefer free tests for free users
    if (test.isFree) {
      score += 0.1
    }

    // Prefer appropriate difficulty
    // TODO: Match with user's average performance

    return {
      test,
      score,
      reason: generateReason(test, analytics?.weakTopics || []),
    }
  })

  // Sort by score and return top 5
  scoredTests.sort((a: any, b: any) => b.score - a.score)

  return scoredTests.slice(0, 5).map(({ test, score, reason }: any) => ({
    testId: test.id,
    title: test.title,
    category: test.category.name,
    score,
    reason,
  }))
}

function generateReason(test: any, weakTopics: string[]): string {
  const reasons = []

  if (test.testType === 'TOPIC_WISE') {
    reasons.push('Focuses on specific topics')
  }

  if (test.testType === 'PREVIOUS_YEAR') {
    reasons.push('Real exam pattern')
  }

  if (weakTopics.length > 0) {
    reasons.push('Covers your weak areas')
  }

  if (test.isFree) {
    reasons.push('Free practice')
  }

  return reasons.join(' • ') || 'Recommended for you'
}

// Get weak topic recommendations
export async function getWeakTopicRecommendations(userId: string) {
  const userProgress = await prisma.userProgress.findMany({
    where: { userId },
    select: {
      questionId: true,
      isCorrect: true,
      question: {
        select: {
          topicId: true,
          topic: {
            select: {
              id: true,
              name: true,
              subject: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
  })

  // Calculate accuracy per topic
  const topicStats = new Map<string, { correct: number; total: number; name: string; subject: string }>()

  userProgress.forEach((progress: any) => {
    const topicId = progress.question.topicId
    const stats = topicStats.get(topicId) || {
      correct: 0,
      total: 0,
      name: progress.question.topic.name,
      subject: progress.question.topic.subject.name,
    }

    stats.total++
    if (progress.isCorrect) stats.correct++

    topicStats.set(topicId, stats)
  })

  // Find weak topics (< 60% accuracy, at least 5 attempts)
  const weakTopics = Array.from(topicStats.entries())
    .filter(([_, stats]) => {
      const accuracy = (stats.correct / stats.total) * 100
      return stats.total >= 5 && accuracy < 60
    })
    .map(([topicId, stats]: any) => ({
      topicId,
      name: stats.name,
      subject: stats.subject,
      accuracy: (stats.correct / stats.total) * 100,
      questionsAttempted: stats.total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy) // Worst first

  return weakTopics.slice(0, 5)
}

// Get spaced repetition recommendations
export async function getSpacedRepetitionRecommendations(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dueReviews = await prisma.userRecommendation.findMany({
    where: {
      userId,
      recommendationType: 'SPACED_REPETITION',
      nextReviewDate: {
        lte: today,
      },
      isCompleted: false,
    },
    orderBy: {
      nextReviewDate: 'asc',
    },
    take: 20,
  })

  return dueReviews
}

// Create recommendation when user completes an activity
export async function createRecommendation(
  userId: string,
  type: string,
  itemId: string,
  itemType: string,
  score: number,
  reason?: string
) {
  return prisma.userRecommendation.create({
    data: {
      userId,
      recommendationType: type as any,
      itemId,
      itemType,
      score,
      reason,
    },
  })
}

// Track user interaction for personalization
export async function trackInteraction(
  userId: string,
  itemId: string,
  itemType: string,
  interactionType: string,
  metadata?: any
) {
  return prisma.userInteraction.create({
    data: {
      userId,
      itemId,
      itemType,
      interactionType: interactionType as any,
      metadata,
    },
  })
}

// Get collaborative filtering recommendations (similar users)
export async function getSimilarUserRecommendations(userId: string) {
  // Get user's test attempts
  const userAttempts = await prisma.testAttempt.findMany({
    where: {
      userId,
      status: 'COMPLETED',
    },
    select: {
      testId: true,
      accuracy: true,
    },
  })

  if (userAttempts.length < 3) {
    return [] // Not enough data
  }

  const userTestIds = userAttempts.map((a: any) => a.testId)
  const userAvgAccuracy = userAttempts.reduce((sum: number, a: any) => sum + a.accuracy, 0) / userAttempts.length

  // Find similar users (took at least 2 same tests, similar accuracy)
  const similarUsers = await prisma.testAttempt.findMany({
    where: {
      testId: { in: userTestIds },
      userId: { not: userId },
      status: 'COMPLETED',
      accuracy: {
        gte: userAvgAccuracy - 15,
        lte: userAvgAccuracy + 15,
      },
    },
    distinct: ['userId'],
    select: {
      userId: true,
    },
    take: 50,
  })

  const similarUserIds = similarUsers.map((u: any) => u.userId)

  // Find tests these users completed but current user hasn't
  const recommendations = await prisma.testAttempt.findMany({
    where: {
      userId: { in: similarUserIds },
      testId: { notIn: userTestIds },
      status: 'COMPLETED',
    },
    select: {
      testId: true,
      test: {
        select: {
          title: true,
          category: { select: { name: true } },
        },
      },
    },
    distinct: ['testId'],
    take: 10,
  })

  return recommendations.map((r: any) => ({
    testId: r.testId,
    title: r.test.title,
    category: r.test.category.name,
    reason: 'Students similar to you found this helpful',
  }))
}
