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

    const questions = await generateQuestions(
      topic,
      numQuestions,
      difficulty?.toUpperCase() || 'MEDIUM'
    )

    if (!Array.isArray(questions)) {
      throw new Error('AI did not return a valid array of questions')
    }

    // For now, return success with test info
    // Questions will be added manually or through a different flow
    // TODO: Implement proper topic/subject hierarchy for question creation
    
    const questionIds = [];

    for (const q of questions) {
      let subject = await prisma.subject.findFirst({
        where: { name: q.subject, categoryId: category.id },
      });
      if (!subject) {
        subject = await prisma.subject.create({
          data: {
            name: q.subject,
            slug: q.subject.toLowerCase().replace(/\s+/g, '-'),
            categoryId: category.id,
          },
        });
      }

      let topicDb = await prisma.topic.findFirst({
        where: { name: q.topic, subjectId: subject.id },
      });
      if (!topicDb) {
        topicDb = await prisma.topic.create({
          data: {
            name: q.topic,
            slug: q.topic.toLowerCase().replace(/\s+/g, '-'),
            subjectId: subject.id,
          },
        });
      }

      // Resolve correct option letter robustly
      const letters = ['A','B','C','D'] as const
      const opts = [q.options[0], q.options[1], q.options[2], q.options[3]]
      const normalized = (s: any) => (s ?? '').toString().trim().replace(/\s+/g,' ')
      let correctLetter: string | null = null
      if (q.correctOption && letters.includes(String(q.correctOption).toUpperCase() as any)) {
        correctLetter = String(q.correctOption).toUpperCase()
      } else if (q.correctAnswer) {
        // Try exact text match
        const idx = opts.findIndex(opt => normalized(opt).toLowerCase() === normalized(q.correctAnswer).toLowerCase())
        if (idx >= 0) correctLetter = letters[idx]
        // Try pattern like "Option A" or "(A)"
        if (!correctLetter) {
          const m = String(q.correctAnswer).match(/[\(\s]?([A-D])[\)\s]?/i)
          if (m) correctLetter = m[1].toUpperCase()
        }
      }
      if (!correctLetter) {
        // Fallback to first option to avoid nulls (better than undefined)
        correctLetter = 'A'
      }

      const newQuestion = await prisma.question.create({
        data: {
          questionText: q.questionText,
          questionType: 'MCQ',
          difficulty: q.difficulty,
          marks: 1,
          negativeMarks: 0.25,
          explanation: q.explanation,
          optionA: q.options[0],
          optionB: q.options[1],
          optionC: q.options[2],
          optionD: q.options[3],
          correctOption: correctLetter,
          topicId: topicDb.id,
          isVerified: true,
          moderationStatus: 'APPROVED',
        },
      });
      questionIds.push(newQuestion.id);
    }

    await prisma.test.update({
      where: { id: test.id },
      data: { questionIds: questionIds },
    });
    
    return NextResponse.json({
      success: true,
      test: {
        id: test.id,
        title: test.title,
        questionsCount: questionIds.length,
      },
      questionsGenerated: questions.length,
      message: `Test created successfully. ${questions.length} questions generated and linked.`,
    })
  } catch (error) {
    console.error('AI Test Generation Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate test', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
