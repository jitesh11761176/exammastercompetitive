// lib/test-engine/scoring-engine.ts
// PRISMA MIGRATION: Now uses Firebase Firestore
// Scoring functions are stubs pending Firebase migration

interface Answer {
  questionId: string
  answer: string | string[] | number | null
  timeTaken: number
}

export async function calculateTestScore(
  _answers: Answer[],
  _test: any
): Promise<{
  score: number
  totalMarks: number
  correctAnswers: number
  wrongAnswers: number
  partialCorrect: number
  unattempted: number
  detailedReport: any[]
}> {
  console.log("[Scoring] Calculate test score - Firebase migration pending")
  return {
    score: 0,
    totalMarks: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    partialCorrect: 0,
    unattempted: 0,
    detailedReport: [],
  }
}

export async function canUserReattemptTest(
  _userId: string,
  _testId: string
): Promise<{ canAttempt: boolean; reason?: string; attemptNumber?: number }> {
  console.log("[Scoring] Check reattempt - Firebase migration pending")
  return { canAttempt: true, attemptNumber: 1 }
}

export function calculateSectionScores(
  _sections: any[],
  _detailedReport: any[]
): any[] {
  console.log("[Scoring] Calculate section scores - Firebase migration pending")
  return _sections.map((section: any) => ({
    name: section.name,
    score: 0,
    maxScore: section.marks,
    correct: 0,
    wrong: 0,
    unattempted: 0,
    accuracy: 0,
  }))
}
