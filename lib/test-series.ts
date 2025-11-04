import { prisma } from './prisma'

export async function getTestSeriesBySlug(slug: string, examId: string, userId?: string) {
  const testSeries = await prisma.testSeries.findFirst({
    where: {
      slug,
      examId,
      isActive: true,
    },
    include: {
      exam: {
        include: {
          category: true,
        },
      },
      tests: {
        where: {
          isActive: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
      ...(userId && {
        enrollments: {
          where: {
            userId,
            status: 'ACTIVE',
          },
        },
      }),
    },
  })

  return testSeries
}

export async function getAllTestSeries(filters?: {
  examCategory?: string
  exam?: string
  isFree?: boolean
  userId?: string
}) {
  const where: any = {
    isActive: true,
    publishedAt: { not: null },
  }

  if (filters?.examCategory) {
    where.exam = {
      category: {
        slug: filters.examCategory,
      },
    }
  }

  if (filters?.exam) {
    where.exam = {
      ...where.exam,
      slug: filters.exam,
    }
  }

  if (filters?.isFree !== undefined) {
    where.isFree = filters.isFree
  }

  const testSeries = await prisma.testSeries.findMany({
    where,
    include: {
      exam: {
        include: {
          category: true,
        },
      },
      _count: {
        select: {
          tests: true,
          enrollments: true,
        },
      },
      ...(filters?.userId && {
        enrollments: {
          where: {
            userId: filters.userId,
            status: 'ACTIVE',
          },
          take: 1,
        },
      }),
    },
    orderBy: [
      { order: 'asc' },
      { createdAt: 'desc' },
    ],
  })

  return testSeries
}

export async function checkTestAccess(userId: string, testId: string) {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      series: {
        include: {
          enrollments: {
            where: {
              userId,
              status: 'ACTIVE',
            },
          },
        },
      },
    },
  })

  if (!test) {
    return { hasAccess: false, reason: 'Test not found' }
  }

  // If test is part of a series
  if (test.seriesId) {
    // Check if user is enrolled
    if (!test.series?.enrollments || test.series.enrollments.length === 0) {
      return {
        hasAccess: false,
        reason: 'You need to enroll in the test series to access this test',
      }
    }

    const enrollment = test.series.enrollments[0]

    // Check if enrollment is expired
    if (enrollment.expiresAt < new Date()) {
      return {
        hasAccess: false,
        reason: 'Your enrollment has expired. Please renew to continue.',
      }
    }

    // Check if test is locked
    if (test.isLocked && test.order && test.order > 1) {
      const previousTest = await prisma.test.findFirst({
        where: {
          seriesId: test.seriesId,
          order: test.order - 1,
        },
      })

      if (previousTest) {
        const previousAttempt = await prisma.testAttempt.findFirst({
          where: {
            userId,
            testId: previousTest.id,
            status: 'COMPLETED',
          },
        })

        if (!previousAttempt) {
          return {
            hasAccess: false,
            reason: `Complete "${previousTest.title}" first to unlock this test`,
          }
        }
      }
    }
  }

  // If test is free or not part of series
  return { hasAccess: true }
}

export async function updateTestSeriesStats(seriesId: string) {
  const tests = await prisma.test.count({
    where: {
      seriesId,
      isActive: true,
    },
  })

  const questions = await prisma.test.findMany({
    where: {
      seriesId,
      isActive: true,
    },
    select: {
      questionIds: true,
    },
  })

  const totalQuestions = questions.reduce(
    (sum, test) => sum + test.questionIds.length,
    0
  )

  await prisma.testSeries.update({
    where: { id: seriesId },
    data: {
      totalTests: tests,
      totalQuestions,
    },
  })
}
