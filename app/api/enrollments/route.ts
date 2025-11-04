import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/enrollments - Get user's course enrollments
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // 'ACTIVE', 'EXPIRED', etc.

    const where: any = {
      userId: session.user.id,
    }

    // Note: CourseEnrollment doesn't have a status field in the current schema
    // If you need status filtering, you may need to add it to the schema
    // if (status) {
    //   where.status = status
    // }

    const enrollments = await prisma.courseEnrollment.findMany({
      where,
      include: {
        course: {
          include: {
            categories: {
              where: {
                isActive: true,
              },
              include: {
                tests: {
                  where: {
                    isActive: true,
                  },
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    })

    return NextResponse.json(enrollments)
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    )
  }
}
