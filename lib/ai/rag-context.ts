// lib/ai/rag-context.ts
// PRISMA MIGRATION: This module requires Firebase migration
// All RAG context functions are stubbed pending Firebase implementation

export async function getRAGContext(_query: string, _questionId?: string): Promise<string> {
  console.log('[RAG] Context retrieval - Firebase migration pending')
  return 'No context available - Firebase migration in progress'
}

export async function getSimilarQuestions(_questionId: string, _limit: number = 5) {
  console.log('[RAG] Similar questions - Firebase migration pending')
  return []
}
