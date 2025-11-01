import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { testId } = await request.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const attempt = await prisma.testAttempt.create({
      data: {
        userId: user.id,
        testId,
        startTime: new Date(),
        status: 'IN_PROGRESS',
        answers: {},
        totalMarks: 0,
      }
    })

    return NextResponse.json(attempt)
  } catch (error) {
    console.error('Error starting attempt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
