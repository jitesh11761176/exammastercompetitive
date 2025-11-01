import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET({ params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: params.id },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            duration: true,
            passingMarks: true,
            difficulty: true,
          },
        },
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (attempt.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      ...attempt,
      totalMarks: attempt.totalMarks,
    })
  } catch (error) {
    console.error('Error fetching attempt:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attempt' },
      { status: 500 }
    )
  }
}
