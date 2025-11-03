import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { testInfo, questions } = await request.json()

    // Validate input
    if (!testInfo.title || questions.length === 0) {
      return NextResponse.json(
        { error: 'Test title and at least one question are required' },
        { status: 400 }
      )
    }

    // Find or create a default category
    let category = await prisma.category.findFirst({
      where: { slug: 'general' }
    })

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'General',
          slug: 'general',
          description: 'General category for tests',
          isActive: true
        }
      })
    }

    // Create test
    const test = await prisma.test.create({
      data: {
        title: testInfo.title,
        description: testInfo.description || `${testInfo.examType} test`,
        duration: testInfo.duration,
        totalQuestions: questions.length,
        totalMarks: questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0),
        passingMarks: Math.ceil(questions.length * 0.33), // 33% passing
        categoryId: category.id,
        isFree: true,
        isActive: true,
        testType: 'CUSTOM',
        questionIds: [], // Will be populated after creating questions
      }
    })

    // Find or create a default subject
    let subject = await prisma.subject.findFirst({
      where: { 
        slug: 'general',
        categoryId: category.id 
      }
    })

    if (!subject) {
      subject = await prisma.subject.create({
        data: {
          name: 'General',
          slug: 'general',
          categoryId: category.id,
          isActive: true
        }
      })
    }

    // Find or create a default topic
    let topic = await prisma.topic.findFirst({
      where: { 
        slug: 'general',
        subjectId: subject.id 
      }
    })

    if (!topic) {
      topic = await prisma.topic.create({
        data: {
          name: 'General',
          slug: 'general',
          subjectId: subject.id,
          difficulty: testInfo.difficulty || 'MEDIUM',
          isActive: true
        }
      })
    }

    // Create questions
    const questionIds: string[] = []

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]

      const question = await prisma.question.create({
        data: {
          questionText: q.content,
          questionType: 'MCQ',
          optionA: q.options.A,
          optionB: q.options.B,
          optionC: q.options.C,
          optionD: q.options.D,
          correctOption: q.correctAnswer,
          explanation: q.explanation || `The correct answer is option ${q.correctAnswer}.`,
          marks: q.marks || 1,
          negativeMarks: 0.25,
          difficulty: testInfo.difficulty || 'MEDIUM',
          topicId: topic.id,
          isActive: true
        }
      })

      questionIds.push(question.id)
    }

    // Update test with question IDs
    await prisma.test.update({
      where: { id: test.id },
      data: { questionIds }
    })

    return NextResponse.json({
      success: true,
      testId: test.id,
      message: `Test created successfully with ${questions.length} questions`
    })
  } catch (error: any) {
    console.error('Test creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create test' },
      { status: 500 }
    )
  }
}
