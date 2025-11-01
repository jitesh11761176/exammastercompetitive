import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check if analytics exists
    const analytics = await prisma.analytics.findUnique({
      where: { userId },
    })

    if (!analytics) {
      await prisma.analytics.create({
        data: { userId },
      })
      console.log('[Setup] Created analytics for user:', userId)
    }

    // Check if gamification exists
    const gamification = await prisma.gamification.findUnique({
      where: { userId },
    })

    if (!gamification) {
      await prisma.gamification.create({
        data: { userId },
      })
      console.log('[Setup] Created gamification for user:', userId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Setup] Error:', error)
    return NextResponse.json(
      { error: 'Setup failed' },
      { status: 500 }
    )
  }
}
