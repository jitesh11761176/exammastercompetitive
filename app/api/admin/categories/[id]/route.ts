import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const categoryId = params.id

    // Check if category exists and get counts
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            subjects: true,
            tests: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      )
    }

    // Get counts for subjects and topics
    const subjectsCount = category._count.subjects
    
    const topicsCount = await prisma.topic.count({
      where: {
        subject: {
          categoryId: categoryId
        }
      }
    })

    const questionsCount = await prisma.question.count({
      where: {
        topic: {
          subject: {
            categoryId: categoryId
          }
        }
      }
    })

    // Delete in correct order to respect foreign key constraints
    // Cascade delete will handle: subjects -> topics -> questions
    await prisma.category.delete({
      where: { id: categoryId }
    })

    return NextResponse.json({
      success: true,
      message: `Category "${category.name}" deleted successfully`,
      details: {
        subjects: subjectsCount,
        topics: topicsCount,
        questions: questionsCount,
        tests: category._count.tests
      }
    })

  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete category',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
