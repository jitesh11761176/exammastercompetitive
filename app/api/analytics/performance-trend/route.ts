import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
// PRISMA MIGRATION: import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get test attempts within date range
    const attempts = await prisma.testAttempt.findMany({
      where: {
        userId: session.user.id,
        status: 'COMPLETED',
        endTime: {
          gte: startDate,
        },
      },
      orderBy: { endTime: 'asc' },
      select: {
        accuracy: true,
        endTime: true,
        score: true,
      },
    })

    // Group by date and calculate averages
    const dateMap = new Map<string, { scores: number[]; count: number }>()

    attempts.forEach((attempt: any) => {
      const date = attempt.endTime!.toISOString().split('T')[0]
      if (!dateMap.has(date)) {
        dateMap.set(date, { scores: [], count: 0 })
      }
      const entry = dateMap.get(date)!
      entry.scores.push(attempt.accuracy || 0)
      entry.count++
    })

    // Fill in missing dates and calculate daily averages
    const trendData = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const shortDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })

      const entry = dateMap.get(dateStr)
      if (entry && entry.scores.length > 0) {
        const avgScore =
          entry.scores.reduce((sum, s) => sum + s, 0) / entry.scores.length
        trendData.push({
          date: shortDate,
          score: Number(avgScore.toFixed(1)),
          testsCount: entry.count,
          average: 65, // Platform average - could be calculated from all users
        })
      } else {
        trendData.push({
          date: shortDate,
          score: null,
          testsCount: 0,
          average: 65,
        })
      }
    }

    // Calculate overall trend
    const firstHalf = attempts.slice(0, Math.floor(attempts.length / 2))
    const secondHalf = attempts.slice(Math.floor(attempts.length / 2))

    const firstHalfAvg =
      firstHalf.length > 0
        ? firstHalf.reduce((sum: number, a: any) => sum + (a.accuracy || 0), 0) /
          firstHalf.length
        : 0
    const secondHalfAvg =
      secondHalf.length > 0
        ? secondHalf.reduce((sum: number, a: any) => sum + (a.accuracy || 0), 0) /
          secondHalf.length
        : 0

    const trend =
      secondHalfAvg > firstHalfAvg
        ? 'improving'
        : secondHalfAvg < firstHalfAvg
        ? 'declining'
        : 'stable'
    const trendPercentage =
      firstHalfAvg > 0
        ? (((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100).toFixed(1)
        : '0'

    return NextResponse.json({
      data: trendData,
      trend,
      trendPercentage: Number(trendPercentage),
      totalTests: attempts.length,
    })
  } catch (error) {
    console.error('Error fetching performance trend:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance trend' },
      { status: 500 }
    )
  }
}
