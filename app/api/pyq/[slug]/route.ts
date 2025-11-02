import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/pyq/[slug] - Get single PYQ collection details
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const examId = req.nextUrl.searchParams.get('examId') || ''

    const pyqCollection = await prisma.pYQCollection.findFirst({
      where: {
        slug: slug,
        examId: examId,
        isActive: true,
      },
      include: {
        exam: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        tests: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            title: true,
            slug: true,
            pyqYear: true,
            duration: true,
            totalQuestions: true,
            totalMarks: true,
            difficulty: true,
            isLocked: true,
          },
          orderBy: {
            pyqYear: 'desc',
          },
        },
      },
    })

    if (!pyqCollection) {
      return NextResponse.json(
        { error: 'PYQ collection not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(pyqCollection)
  } catch (error) {
    console.error('Error fetching PYQ collection:', error)
    return NextResponse.json(
      { error: 'Failed to fetch PYQ collection' },
      { status: 500 }
    )
  }
}
