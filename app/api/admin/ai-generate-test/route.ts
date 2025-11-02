import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateQuestions } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // @ts-ignore - role exists
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { topic, examType, difficulty, numQuestions, categoryId } = body

    if (!topic || !numQuestions) {
      return NextResponse.json(
        { error: 'Topic and number of questions are required' },
        { status: 400 }
      )
    }

    // Get or create category
    let category = categoryId
      ? await prisma.category.findUnique({ where: { id: categoryId } })
      : null

    if (!category) {
      // Create a default category based on topic
      category = await prisma.category.create({
        data: {
          name: examType || topic,
          slug: (examType || topic).toLowerCase().replace(/\s+/g, '-'),
          description: `Auto-generated category for ${topic}`,
          isActive: true,
        },
      })
    }

    // Create test
    const test = await prisma.test.create({
      data: {
        title: `${topic} - ${examType || 'Practice Test'}`,
        description: `AI-generated test on ${topic}`,
        categoryId: category.id,
        testType: 'SECTIONAL',
        duration: numQuestions * 60, // 1 minute per question
        totalMarks: numQuestions,
        totalQuestions: numQuestions,
        difficulty: difficulty?.toUpperCase() || 'MEDIUM',
        isActive: true,
        isFree: true,
      },
    })

    // Generate questions with AI
    const aiResponse = await generateQuestions(topic, numQuestions)
    
    let questions
    try {
      // Try to parse the AI response as JSON
      questions = JSON.parse(aiResponse)
      if (!Array.isArray(questions)) {
        questions = [questions]
      }
    } catch (e) {
      // If direct parse fails, try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse AI response')
      }
    }

    // Create questions in database
    const createdQuestions = await Promise.all(
      questions.slice(0, numQuestions).map(async (q: any, index: number) => {
        return prisma.question.create({
          data: {
            testId: test.id,
            categoryId: category!.id,
            question: q.question,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || '',
            subject: q.subject || topic,
            topic: q.topic || topic,
            difficulty: difficulty?.toUpperCase() || 'MEDIUM',
            marks: 1,
            negativeMarks: 0.25,
            order: index + 1,
            type: 'MCQ',
          },
        })
      })
    )

    return NextResponse.json({
      success: true,
      test: {
        id: test.id,
        title: test.title,
        questionsCount: createdQuestions.length,
      },
      message: `Test created with ${createdQuestions.length} questions`,
    })
  } catch (error) {
    console.error('AI Test Generation Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate test', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
