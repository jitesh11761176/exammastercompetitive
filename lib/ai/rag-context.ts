import { prisma } from '@/lib/prisma'

// Get relevant context from solutions database for RAG
export async function getRAGContext(query: string, questionId?: string): Promise<string> {
  let context = ''

  // If specific question, get its full details
  if (questionId) {
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

    if (question) {
      context += `Question Context:\n`
      context += `Subject: ${question.topic.subject.name}\n`
      context += `Topic: ${question.topic.name}\n`
      context += `Question: ${question.questionText}\n`
      
      if (question.explanation) {
        context += `\nExplanation: ${question.explanation}\n`
      }
      
      if (question.mathSolution) {
        context += `\nMath Solution: ${question.mathSolution}\n`
      }

      // Get related questions from same topic
      const relatedQuestions = await prisma.question.findMany({
        where: {
          topicId: question.topicId,
          id: { not: questionId },
          isActive: true,
        },
        select: {
          questionText: true,
          explanation: true,
        },
        take: 3,
      })

      if (relatedQuestions.length > 0) {
        context += `\nRelated Questions & Solutions:\n`
        relatedQuestions.forEach((q, i) => {
          context += `${i + 1}. ${q.questionText.slice(0, 100)}...\n`
          context += `Solution: ${q.explanation.slice(0, 200)}...\n\n`
        })
      }
    }
  } else {
    // Search for relevant questions based on query keywords
    // Extract key terms from query
    const keywords = extractKeywords(query)
    
    if (keywords.length > 0) {
      const relevantQuestions = await prisma.question.findMany({
        where: {
          OR: keywords.map(keyword => ({
            OR: [
              { questionText: { contains: keyword, mode: 'insensitive' } },
              { explanation: { contains: keyword, mode: 'insensitive' } },
              { tags: { has: keyword.toLowerCase() } },
            ],
          })),
          isActive: true,
        },
        include: {
          topic: {
            select: {
              name: true,
              subject: {
                select: { name: true },
              },
            },
          },
        },
        take: 5,
      })

      if (relevantQuestions.length > 0) {
        context += `Relevant Questions & Explanations:\n\n`
        relevantQuestions.forEach((q, i) => {
          context += `${i + 1}. Topic: ${q.topic.subject.name} - ${q.topic.name}\n`
          context += `Q: ${q.questionText.slice(0, 150)}...\n`
          context += `A: ${q.explanation.slice(0, 250)}...\n\n`
        })
      }
    }
  }

  return context || 'No specific context found. I will help based on general knowledge.'
}

// Extract keywords from query
function extractKeywords(query: string): string[] {
  // Remove common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'is', 'are', 'was', 'were', 'what', 'how', 'why', 'when', 'where',
    'can', 'could', 'should', 'would', 'will', 'do', 'does', 'did',
    'explain', 'help', 'understand', 'solve', 'question', 'doubt',
  ])

  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))

  return [...new Set(words)].slice(0, 5) // Top 5 unique keywords
}

// Get similar questions based on topic and difficulty
export async function getSimilarQuestions(questionId: string, limit: number = 5) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: {
      topicId: true,
      difficulty: true,
      tags: true,
    },
  })

  if (!question) return []

  const similar = await prisma.question.findMany({
    where: {
      topicId: question.topicId,
      difficulty: question.difficulty,
      id: { not: questionId },
      isActive: true,
    },
    include: {
      topic: {
        select: {
          name: true,
          subject: { select: { name: true } },
        },
      },
    },
    take: limit,
  })

  return similar
}
