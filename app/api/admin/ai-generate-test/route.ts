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
        passingMarks: Math.floor(numQuestions * 0.33), // 33% passing marks
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

    // For now, return success with test info
    // Questions will be added manually or through a different flow
    // TODO: Implement proper topic/subject hierarchy for question creation
    
    return NextResponse.json({
      success: true,
      test: {
        id: test.id,
        title: test.title,
        questionsCount: 0, // Questions not yet linked
      },
      questionsGenerated: questions.length,
      message: `Test created successfully. ${questions.length} questions generated but need to be linked through proper topic hierarchy.`,
      note: 'Please use the test editor to add questions to this test.'
    })
  } catch (error) {
    console.error('AI Test Generation Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate test', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
