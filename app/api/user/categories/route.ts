import { NextRequest, NextResponse } from 'next/server'
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
        interestedCategories: {
          include: {
            category: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user.interestedCategories.map(uc => uc.category))
  } catch (error) {
    console.error('Error fetching user categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { categoryIds } = await request.json()

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json({ error: 'Invalid category IDs' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete existing categories
    await prisma.userCategory.deleteMany({
      where: { userId: user.id }
    })

    // Create new category associations
    await prisma.userCategory.createMany({
      data: categoryIds.map(categoryId => ({
        userId: user.id,
        categoryId
      }))
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving user categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
