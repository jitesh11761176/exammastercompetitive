import { prisma } from '@/lib/prisma'

interface Answer {
  questionId: string
  answer: string | string[] | number | null
  timeTaken: number
}

interface QuestionWithCorrect {
  id: string
  questionType: string
  correctOption?: string | null
  correctOptions?: string[]
  integerAnswer?: number | null
  rangeMin?: number | null
  rangeMax?: number | null
  marks: number
  negativeMarks: number
  partialMarking: boolean
  partialMarkingRules?: any
}

export async function calculateTestScore(
  answers: Answer[],
  test: any
): Promise<{
  score: number
  totalMarks: number
  correctAnswers: number
  wrongAnswers: number
  partialCorrect: number
  unattempted: number
  detailedReport: any[]
}> {
  // Fetch all questions for the test
  const questions = await prisma.question.findMany({
    where: {
      id: {
        in: test.questionIds,
      },
    },
    select: {
      id: true,
      questionType: true,
      correctOption: true,
      correctOptions: true,
      integerAnswer: true,
      rangeMin: true,
      rangeMax: true,
      marks: true,
      negativeMarks: true,
      partialMarking: true,
      partialMarkingRules: true,
    },
  })

  const questionMap = new Map<string, QuestionWithCorrect>(
    questions.map((q: any) => [q.id as string, q as QuestionWithCorrect])
  )
  
  let score = 0
  let correctAnswers = 0
  let wrongAnswers = 0
  let partialCorrect = 0
  let unattempted = 0
  const detailedReport: any[] = []

  // Negative marking rules (if present on test) can be handled per question; not used here

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId) as QuestionWithCorrect
    if (!question) continue

    let questionScore = 0
    let isCorrect = false
    let isPartialCorrect = false
    let feedback = ''

    if (!answer.answer || answer.answer === null) {
      // Unattempted
      unattempted++
      feedback = 'Not attempted'
    } else {
      // Check answer based on question type
      switch (question.questionType) {
        case 'MCQ':
        case 'TRUE_FALSE':
          if (answer.answer === question.correctOption) {
            isCorrect = true
            questionScore = question.marks
            correctAnswers++
            feedback = 'Correct'
          } else {
            wrongAnswers++
            questionScore = -question.negativeMarks
            feedback = `Wrong. Correct answer: ${question.correctOption}`
          }
          break

        case 'MSQ':
          const userAnswers: string[] = (
            Array.isArray(answer.answer) ? answer.answer : [answer.answer]
          ).map((v) => String(v))
          const correctOpts = question.correctOptions || []
          
          // Check if completely correct
          const isFullyCorrect = 
            userAnswers.length === correctOpts.length &&
            userAnswers.every(opt => correctOpts.includes(opt))

          if (isFullyCorrect) {
            isCorrect = true
            questionScore = question.marks
            correctAnswers++
            feedback = 'Correct'
          } else if (question.partialMarking) {
            // Calculate partial credit
            const correctSelected = userAnswers.filter(opt => correctOpts.includes(opt)).length
            const wrongSelected = userAnswers.filter(opt => !correctOpts.includes(opt)).length
            
            if (correctSelected > 0 && wrongSelected === 0) {
              isPartialCorrect = true
              partialCorrect++
              
              // Partial marks = (correct selected / total correct) * full marks
              const partialRatio = correctSelected / correctOpts.length
              questionScore = question.marks * partialRatio
              feedback = `Partially correct (${correctSelected}/${correctOpts.length})`
            } else {
              wrongAnswers++
              questionScore = -question.negativeMarks
              feedback = `Wrong. Correct answers: ${correctOpts.join(', ')}`
            }
          } else {
            wrongAnswers++
            questionScore = -question.negativeMarks
            feedback = `Wrong. Correct answers: ${correctOpts.join(', ')}`
          }
          break

        case 'INTEGER':
          if (answer.answer === question.integerAnswer) {
            isCorrect = true
            questionScore = question.marks
            correctAnswers++
            feedback = 'Correct'
          } else {
            wrongAnswers++
            questionScore = -question.negativeMarks
            feedback = `Wrong. Correct answer: ${question.integerAnswer}`
          }
          break

        case 'RANGE':
          const numAnswer = typeof answer.answer === 'number' 
            ? answer.answer 
            : parseFloat(answer.answer as string)
          
          if (
            numAnswer >= (question.rangeMin || 0) && 
            numAnswer <= (question.rangeMax || 0)
          ) {
            isCorrect = true
            questionScore = question.marks
            correctAnswers++
            feedback = 'Correct'
          } else {
            wrongAnswers++
            questionScore = -question.negativeMarks
            feedback = `Wrong. Correct range: ${question.rangeMin} - ${question.rangeMax}`
          }
          break

        case 'SUBJECTIVE':
          // Subjective questions need manual evaluation
          feedback = 'Pending manual evaluation'
          break
      }
    }

    score += questionScore

    detailedReport.push({
      questionId: answer.questionId,
      userAnswer: answer.answer,
      isCorrect,
      isPartialCorrect,
      marksAwarded: questionScore,
      feedback,
      timeTaken: answer.timeTaken,
    })
  }

  return {
    score: Math.max(0, score), // Don't let score go negative
  totalMarks: questions.reduce((sum: number, q: any) => sum + (q.marks || 0), 0),
    correctAnswers,
    wrongAnswers,
    partialCorrect,
    unattempted,
    detailedReport,
  }
}

// Helper function to check if user can reattempt
export async function canUserReattemptTest(
  userId: string,
  testId: string
): Promise<{ canAttempt: boolean; reason?: string; attemptNumber?: number }> {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: {
      allowReattempt: true,
      maxAttempts: true,
    },
  })

  if (!test) {
    return { canAttempt: false, reason: 'Test not found' }
  }

  if (!test.allowReattempt) {
    const existingAttempt = await prisma.testAttempt.findFirst({
      where: { userId, testId, status: 'COMPLETED' },
    })
    
    if (existingAttempt) {
      return { canAttempt: false, reason: 'Reattempts not allowed for this test' }
    }
  }

  const attemptCount = await prisma.testAttempt.count({
    where: { userId, testId, status: 'COMPLETED' },
  })

  if (attemptCount >= test.maxAttempts) {
    return { 
      canAttempt: false, 
      reason: `Maximum attempts (${test.maxAttempts}) reached` 
    }
  }

  return { canAttempt: true, attemptNumber: attemptCount + 1 }
}

// Calculate section-wise scores
export function calculateSectionScores(
  sections: any[],
  detailedReport: any[]
): any[] {
  return sections.map(section => {
    const sectionQuestions = detailedReport.filter(r => 
      section.questionIds.includes(r.questionId)
    )

    const totalMarks = sectionQuestions.reduce((sum, q) => 
      sum + (q.marksAwarded || 0), 0
    )

    const correct = sectionQuestions.filter(q => q.isCorrect).length
    const wrong = sectionQuestions.filter(q => !q.isCorrect && q.userAnswer).length
    const unattempted = sectionQuestions.filter(q => !q.userAnswer).length

    return {
      name: section.name,
      score: totalMarks,
      maxScore: section.marks,
      correct,
      wrong,
      unattempted,
      accuracy: correct / (correct + wrong) * 100 || 0,
    }
  })
}
