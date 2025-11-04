import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const testId = params.id

    // Verify test exists
    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: { id: true, title: true }
    })

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }

    // Delete the test and all related data (cascade delete)
    // This will delete:
    // - Test attempts
    // - Test questions (junction table)
    // Note: This won't delete the actual questions, subjects, topics, or categories
    // as they might be used by other tests
    await prisma.test.delete({
      where: { id: testId }
    })

    return NextResponse.json({
      success: true,
      message: `Test "${test.title}" deleted successfully`
    })

  } catch (error) {
    console.error('Error deleting test:', error)
    return NextResponse.json(
      { error: 'Failed to delete test' },
      { status: 500 }
    )
  }
}
