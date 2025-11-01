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
        questionType: true,
        marks: true,
        negativeMarks: true,
        difficulty: true,
        timeToSolve: true,
      }
    })

    // Transform questions to include options array
    const transformedQuestions = questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      questionImage: q.questionImage,
      questionType: q.questionType || 'SINGLE_CHOICE',
      options: [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean),
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      difficulty: q.difficulty,
      timeToSolve: q.timeToSolve,
    }))

    return NextResponse.json({ ...test, questions: transformedQuestions })
  } catch (error) {
    console.error('Error fetching test:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
