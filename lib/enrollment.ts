import { prisma } from './prisma'

// NOTE: This module has been migrated from TestSeries-based enrollments to Course enrollments.
// The second argument (seriesId) is now treated as courseId for backward compatibility.

export async function createEnrollment(
  userId: string,
  seriesId: string, // Interpreted as courseId in the new model
  _paymentId?: string
) {
  // Validate course
  const course = await prisma.course.findUnique({ where: { id: seriesId } })
  if (!course) {
    throw new Error('Course not found')
  }

  // Upsert course enrollment (unique on userId+courseId)
  const enrollment = await prisma.courseEnrollment.upsert({
    where: {
      userId_courseId: { userId, courseId: course.id },
    },
    update: {
      status: 'ACTIVE',
      enrolledAt: new Date(),
      lastAccessedAt: new Date(),
    },
    create: {
      userId,
      courseId: course.id,
      status: 'ACTIVE',
      enrolledAt: new Date(),
    },
    include: {
      course: true,
    },
  })

  return enrollment
}

export async function getUserEnrollments(userId: string, status?: string) {
  const where: any = { userId }
  if (status) where.status = status as any

  const enrollments = await prisma.courseEnrollment.findMany({
    where,
    include: {
      course: {
        include: {
          categories: {
            where: { isActive: true },
            select: { id: true, name: true, slug: true },
            take: 5,
          },
        },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  })

  return enrollments
}

export async function updateEnrollmentProgress(
  userId: string,
  seriesId: string, // Interpreted as courseId
  testAttemptId: string
) {
  const attempt = await prisma.testAttempt.findUnique({
    where: { id: testAttemptId },
  })
  if (!attempt || attempt.status !== 'COMPLETED') return

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId: seriesId } },
  })
  if (!enrollment) return

  // All completed attempts by this user for tests under this course
  const completedAttempts = await prisma.testAttempt.findMany({
    where: {
      userId,
      status: 'COMPLETED',
      test: {
        category: { courseId: seriesId },
      },
    },
    distinct: ['testId'],
    select: { score: true },
  })

  const totalScore = completedAttempts.reduce((sum: number, a: { score: number }) => sum + (a.score ?? 0), 0)
  const avgScore = completedAttempts.length > 0 ? totalScore / completedAttempts.length : 0

  await prisma.courseEnrollment.update({
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
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId: seriesId } },
  })

  if (!enrollment) {
    return { isEnrolled: false, status: null as any, enrollment: null as any }
  }

  return {
    isEnrolled: enrollment.status === 'ACTIVE',
    status: enrollment.status,
    enrollment,
  }
}
