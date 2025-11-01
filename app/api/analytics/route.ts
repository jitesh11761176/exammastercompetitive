import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        testAttempts: {
          where: { status: 'COMPLETED' },
          include: { test: true },
          orderBy: { endTime: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate statistics
    const totalAttempts = user.testAttempts.length
    const averageScore = totalAttempts > 0
      ? user.testAttempts.reduce((sum: number, attempt: any) => sum + (attempt.accuracy || 0), 0) / totalAttempts
      : 0
    const bestScore = totalAttempts > 0
      ? Math.max(...user.testAttempts.map((a: any) => a.accuracy || 0))
      : 0

    // Performance trend (last 10 tests)
    const performanceTrend = user.testAttempts.slice(0, 10).reverse().map((attempt: any) => ({
      date: attempt.endTime?.toLocaleDateString() || '',
      score: attempt.accuracy || 0
    }))

    // Subject-wise performance
    const subjectMap = new Map<string, { total: number; count: number }>()
    user.testAttempts.forEach((attempt: any) => {
      const subject = attempt.test.categoryId
      const current = subjectMap.get(subject) || { total: 0, count: 0 }
      subjectMap.set(subject, {
        total: current.total + (attempt.accuracy || 0),
        count: current.count + 1
      })
    })

    const subjectWise = Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      score: data.total / data.count,
      attempts: data.count
    }))

    // Test type distribution
    const testTypeMap = new Map<string, number>()
    user.testAttempts.forEach((attempt: any) => {
      const testType = attempt.test.testType
      testTypeMap.set(testType, (testTypeMap.get(testType) || 0) + 1)
    })

    const testTypeWise = Array.from(testTypeMap.entries()).map(([testType, attempts]) => ({
      testType,
      attempts
    }))

    return NextResponse.json({
      totalAttempts,
      averageScore,
      bestScore,
      performanceTrend,
      subjectWise,
      testTypeWise
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
