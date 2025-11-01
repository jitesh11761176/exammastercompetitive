import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { answers } = await request.json()
    const attemptId = params.id

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    // Calculate basic timing
    const timeTaken = Math.floor((Date.now() - attempt!.startTime.getTime()) / 1000)

    // Update attempt
    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
        answers,
        timeTaken,
      }
    })

    return NextResponse.json(updatedAttempt)
  } catch (error) {
    console.error('Error submitting attempt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
