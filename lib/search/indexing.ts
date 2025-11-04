import { prisma } from '@/lib/prisma'
import { indexQuestion, indexQuestions, indexTest } from './meilisearch-client'

// Sync all questions to search index
export async function syncQuestionsToSearchIndex() {
  try {
    const questions = await prisma.question.findMany({
      where: { isActive: true },
      include: {
        topic: {
          include: {
            subject: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    })

  const searchData = questions.map((q: any) => ({
      id: q.id,
      questionText: q.questionText,
      content: `${q.questionText} ${q.explanation || ''}`,
      tags: q.tags,
      difficulty: q.difficulty,
      questionType: q.questionType,
      categoryId: q.topic.subject.categoryId,
      categoryName: q.topic.subject.category.name,
      subjectId: q.topic.subjectId,
      subjectName: q.topic.subject.name,
      topicId: q.topicId,
      topicName: q.topic.name,
      isActive: q.isActive,
      createdAt: q.createdAt.toISOString(),
    }))

    await indexQuestions(searchData)
    
    // Also sync to SearchIndex table
    await prisma.searchIndex.createMany({
  data: searchData.map((q: any) => ({
        documentId: q.id,
        documentType: 'question',
        title: q.questionText.substring(0, 200),
        content: q.content,
        tags: q.tags,
        categoryName: q.categoryName,
        subjectName: q.subjectName,
        topicName: q.topicName,
        difficulty: String(q.difficulty),
      })),
      skipDuplicates: true,
    })

    console.log(`Synced ${questions.length} questions to search index`)
    return questions.length
  } catch (error) {
    console.error('Failed to sync questions:', error)
    throw error
  }
}

// Sync all tests to search index
export async function syncTestsToSearchIndex() {
  try {
    const tests = await prisma.test.findMany({
      where: { isActive: true },
      include: {
        category: true,
      },
    })

  const searchData = tests.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description || '',
      tags: t.tags,
      categoryId: t.categoryId,
      categoryName: t.category.name,
      testType: t.testType,
      difficulty: t.difficulty,
      isFree: t.isFree,
      isActive: t.isActive,
      totalQuestions: t.totalQuestions,
      duration: t.duration,
      createdAt: t.createdAt.toISOString(),
    }))

    // Index to Meilisearch
    for (const test of searchData) {
      await indexTest(test)
    }

    // Also sync to SearchIndex table
    await prisma.searchIndex.createMany({
  data: searchData.map((t: any) => ({
        documentId: t.id,
        documentType: 'test',
        title: t.title,
        content: t.description,
        tags: t.tags,
        categoryName: t.categoryName,
        difficulty: String(t.difficulty),
      })),
      skipDuplicates: true,
    })

    console.log(`Synced ${tests.length} tests to search index`)
    return tests.length
  } catch (error) {
    console.error('Failed to sync tests:', error)
    throw error
  }
}

// Sync a single question
export async function syncQuestionToIndex(questionId: string) {
  try {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        topic: {
          include: {
            subject: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    })

    if (!question) return

    const searchData = {
      id: question.id,
      questionText: question.questionText,
      content: `${question.questionText} ${question.explanation || ''}`,
      tags: question.tags,
      difficulty: question.difficulty,
      questionType: question.questionType,
      categoryId: question.topic.subject.categoryId,
      categoryName: question.topic.subject.category.name,
      subjectId: question.topic.subjectId,
      subjectName: question.topic.subject.name,
      topicId: question.topicId,
      topicName: question.topic.name,
      isActive: question.isActive,
      createdAt: question.createdAt.toISOString(),
    }

    await indexQuestion(searchData)

    // Update SearchIndex table
    await prisma.searchIndex.upsert({
      where: {
        documentId: question.id,
      },
      create: {
        documentId: question.id,
        documentType: 'question',
        title: question.questionText.substring(0, 200),
        content: searchData.content,
        tags: question.tags,
        categoryName: searchData.categoryName,
        subjectName: searchData.subjectName,
        topicName: searchData.topicName,
        difficulty: String(question.difficulty),
      },
      update: {
        title: question.questionText.substring(0, 200),
        content: searchData.content,
        tags: question.tags,
        difficulty: String(question.difficulty),
      },
    })
  } catch (error) {
    console.error('Failed to sync question:', error)
  }
}

// Sync a single test
export async function syncTestToIndex(testId: string) {
  try {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        category: true,
      },
    })

    if (!test) return

    const searchData = {
      id: test.id,
      title: test.title,
      description: test.description || '',
      tags: test.tags,
      categoryId: test.categoryId,
      categoryName: test.category.name,
      testType: test.testType,
      difficulty: test.difficulty,
      isFree: test.isFree,
      isActive: test.isActive,
      totalQuestions: test.totalQuestions,
      duration: test.duration,
      createdAt: test.createdAt.toISOString(),
    }

    await indexTest(searchData)

    // Update SearchIndex table
    await prisma.searchIndex.upsert({
      where: {
        documentId: test.id,
      },
      create: {
        documentId: test.id,
        documentType: 'test',
        title: test.title,
        content: test.description || '',
        tags: test.tags,
        categoryName: searchData.categoryName,
        difficulty: String(test.difficulty),
      },
      update: {
        title: test.title,
        content: test.description || '',
        tags: test.tags,
        difficulty: String(test.difficulty),
      },
    })
  } catch (error) {
    console.error('Failed to sync test:', error)
  }
}
