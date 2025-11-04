import { prisma } from './prisma'

export async function createEnrollment(
  userId: string,
  seriesId: string,
  paymentId?: string
) {
  const testSeries = await prisma.testSeries.findUnique({
    where: { id: seriesId },
  })

  if (!testSeries) {
    throw new Error('Test series not found')
  }

  // Check existing enrollment
  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_seriesId: {
        userId,
        seriesId,
      },
    },
  })

  if (existing && existing.status === 'ACTIVE') {
    throw new Error('Already enrolled')
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + testSeries.validityDays)

  const enrollment = await prisma.enrollment.create({
    data: {
      userId,
      seriesId,
      status: 'ACTIVE',
      enrolledAt: new Date(),
      expiresAt,
      paymentId,
      amountPaid: testSeries.isFree
        ? 0
        : testSeries.discountPrice || testSeries.price,
    },
    include: {
      series: {
        include: {
          exam: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  })

  // Update enrolled count
  await prisma.testSeries.update({
    where: { id: seriesId },
    data: { enrolledCount: { increment: 1 } },
  })

  return enrollment
}

export async function getUserEnrollments(userId: string, status?: string) {
  const where: any = { userId }
  
  if (status) {
    where.status = status
  }

  const enrollments = await prisma.enrollment.findMany({
    where,
    include: {
      series: {
        include: {
          exam: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: {
      enrolledAt: 'desc',
    },
  })

  return enrollments
}

export async function updateEnrollmentProgress(
  userId: string,
  seriesId: string,
  testAttemptId: string
) {
  const attempt = await prisma.testAttempt.findUnique({
    where: { id: testAttemptId },
  })

  if (!attempt || attempt.status !== 'COMPLETED') {
    return
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_seriesId: {
        userId,
        seriesId,
      },
    },
  })

  if (!enrollment) {
    return
  }

  // Get all completed attempts for this series
  const completedAttempts = await prisma.testAttempt.findMany({
    where: {
      userId,
      test: {
        seriesId,
      },
      status: 'COMPLETED',
    },
    distinct: ['testId'],
  })

  const totalScore = completedAttempts.reduce(
    (sum, att) => sum + att.score,
    0
  )
  const avgScore = completedAttempts.length > 0
    ? totalScore / completedAttempts.length
    : 0

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      completedTests: completedAttempts.length,
      totalScore,
      averageScore: avgScore,
      lastAccessedAt: new Date(),
    },
  })
}

export async function checkEnrollmentStatus(userId: string, seriesId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_seriesId: {
        userId,
        seriesId,
      },
    },
  })

  if (!enrollment) {
    return { isEnrolled: false, status: null, enrollment: null }
  }

  // Check if expired
  if (enrollment.status === 'ACTIVE' && enrollment.expiresAt < new Date()) {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'EXPIRED' },
    })

    return {
      isEnrolled: false,
      status: 'EXPIRED',
      enrollment,
    }
  }

  return {
    isEnrolled: enrollment.status === 'ACTIVE',
    status: enrollment.status,
    enrollment,
  }
}
