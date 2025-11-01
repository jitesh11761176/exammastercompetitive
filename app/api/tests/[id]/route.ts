import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const test = await prisma.test.findUnique({
      where: { id: params.id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    })

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Fetch questions separately using questionIds array
    const questions = await prisma.question.findMany({
      where: {
        id: {
          in: test.questionIds
        }
      },
      select: {
        id: true,
        questionText: true,
        questionImage: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        marks: true,
        negativeMarks: true,
        difficulty: true,
        timeToSolve: true,
      }
    })

    return NextResponse.json({ ...test, questions })
  } catch (error) {
    console.error('Error fetching test:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
