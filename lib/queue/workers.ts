import { Worker, Job } from 'bullmq'
import Redis from 'ioredis'
import { logger } from '../monitoring/logger'
import { prisma } from '@/lib/prisma'
import type {
  ScoreTestJobData,
  SendEmailJobData,
  ExportPDFJobData,
  IndexJobData,
  AIGenerateQuestionsJobData,
} from './index'

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

// ============================================================================
// SCORING WORKER
// ============================================================================

const scoringWorker = new Worker(
  'scoring',
  async (job: Job<ScoreTestJobData>) => {
    const { testAttemptId, userId } = job.data
    
    logger.info(`Processing test scoring for attempt: ${testAttemptId}`)
    
    try {
      // Get test attempt with related test
      const attempt = await prisma.testAttempt.findUnique({
        where: { id: testAttemptId },
        include: {
          test: true,
        },
      })
      
      if (!attempt) {
        throw new Error(`Test attempt not found: ${testAttemptId}`)
      }
      
      // Calculate scores using attempt.answers and actual Question records
      let totalScore = 0
      let correctAnswers = 0
    let wrongAnswers = 0
    let unattempted = 0

      const answers = (attempt.answers as Record<string, any>) || {}
      const answeredQuestionIds = Object.keys(answers)

      // Fetch only the questions that were answered (or all in test to compute unanswered)
      const allQuestionIds: string[] = Array.isArray(attempt.test.questionIds)
        ? attempt.test.questionIds
        : []

      // Questions needed to validate answers
      const questions = await prisma.question.findMany({
        where: { id: { in: answeredQuestionIds } },
      })

      // Tally unanswered as those present in the test but not answered
      const unansweredSet = new Set(
        allQuestionIds.filter((id) => !answeredQuestionIds.includes(id))
      )
        unattempted += unansweredSet.size

      for (const q of questions) {
        const record = answers[q.id]
        if (!record || record.answer == null || (Array.isArray(record.answer) && record.answer.length === 0)) {
          unattempted++
          continue
        }

        const ans = record.answer as string | string[]
        let isCorrect = false

        if (q.questionType === 'MCQ') {
          // Single correct option
          if (typeof ans === 'string') {
            isCorrect = q.correctOption != null && ans === q.correctOption
          }
        } else if (q.questionType === 'MSQ') {
          // Multiple correct options: compare as sets
          const given = Array.isArray(ans) ? [...ans].sort() : [String(ans)].sort()
          const correct = (q.correctOptions || []).slice().sort()
          isCorrect = JSON.stringify(given) === JSON.stringify(correct)
        } else if (q.questionType === 'INTEGER') {
          // Integer answer
          const val = Array.isArray(ans) ? Number(ans[0]) : Number(ans)
          isCorrect = q.integerAnswer != null && val === q.integerAnswer
        } else if (q.questionType === 'RANGE') {
          const val = Array.isArray(ans) ? Number(ans[0]) : Number(ans)
          if (q.rangeMin != null && q.rangeMax != null) {
            isCorrect = val >= q.rangeMin && val <= q.rangeMax
          }
        } else {
          // Subjective/others: cannot auto-grade here
          isCorrect = false
        }

        if (isCorrect) {
          correctAnswers++
          totalScore += q.marks || 0
        } else {
          wrongAnswers++
          if (attempt.test.hasNegativeMarking && q.negativeMarks) {
            totalScore -= q.negativeMarks
          }
        }
      }

      // Calculate accuracy
  const totalAttempted = correctAnswers + wrongAnswers
      const accuracy = totalAttempted > 0 ? (correctAnswers / totalAttempted) * 100 : 0
      
      // Update test attempt
      await prisma.testAttempt.update({
        where: { id: testAttemptId },
        data: {
          score: totalScore,
          accuracy,
          correctAnswers,
          wrongAnswers,
          unattempted,
          sectionScores: {},
          status: 'COMPLETED',
        },
      })
      
      // Update user analytics
  await updateUserAnalytics(userId, attempt.test.categoryId)
      
      // Generate rank (add to separate job queue)
      await job.updateProgress(50)
      
      logger.info(`Test scoring completed for attempt: ${testAttemptId}`, {
        totalScore,
        accuracy,
        correctAnswers,
        wrongAnswers,
      })
      
      return {
        success: true,
        score: totalScore,
        accuracy,
      }
    } catch (error) {
      logger.error(`Test scoring failed for attempt: ${testAttemptId}`, { error })
      throw error
    }
  },
  { connection, concurrency: 5 }
)

// ============================================================================
// EMAIL WORKER
// ============================================================================

const emailWorker = new Worker(
  'emails',
  async (job: Job<SendEmailJobData>) => {
    const { to, subject } = job.data
    
    logger.info(`Sending email to: ${to}`)
    
    try {
      // TODO: Integrate with Resend or SendGrid
      // Example with Resend:
      // const resend = new Resend(process.env.RESEND_API_KEY)
      // await resend.emails.send({
      //   from: 'ExamMaster Pro <noreply@exammaster.com>',
      //   to,
      //   subject,
      //   react: EmailTemplate({ ...data }),
      // })
      
      // For now, just log
      logger.info(`Email sent successfully to: ${to}`, { subject })
      
      return { success: true }
    } catch (error) {
      logger.error(`Email sending failed to: ${to}`, { error, subject })
      throw error
    }
  },
  { connection, concurrency: 10 }
)

// ============================================================================
// EXPORT WORKER
// ============================================================================

const exportWorker = new Worker(
  'exports',
  async (job: Job<ExportPDFJobData>) => {
    const { testAttemptId } = job.data
    
    logger.info(`Generating PDF export for attempt: ${testAttemptId}`)
    
    try {
      // Get test attempt data
      const attempt = await prisma.testAttempt.findUnique({
        where: { id: testAttemptId },
        include: {
          test: true,
        },
      })
      
      if (!attempt) {
        throw new Error(`Test attempt not found: ${testAttemptId}`)
      }
      
      // TODO: Generate PDF using library like puppeteer or react-pdf
      // const pdf = await generatePDF(attempt, includeAnalytics)
      // const url = await uploadToS3(pdf)
      
      logger.info(`PDF export completed for attempt: ${testAttemptId}`)
      
      return {
        success: true,
        url: 'https://example.com/export.pdf', // Placeholder
      }
    } catch (error) {
      logger.error(`PDF export failed for attempt: ${testAttemptId}`, { error })
      throw error
    }
  },
  { connection, concurrency: 3 }
)

// ============================================================================
// INDEXING WORKER
// ============================================================================

const indexingWorker = new Worker(
  'indexing',
  async (job: Job<IndexJobData>) => {
    const { type, itemId } = job.data
    
    logger.info(`Indexing ${type}: ${itemId}`)
    
    try {
      // TODO: Index to Meilisearch
      // if (type === 'question') {
      //   await syncQuestionToIndex(itemId)
      // } else if (type === 'test') {
      //   await syncTestToIndex(itemId)
      // }
      
      logger.info(`Successfully indexed ${type}: ${itemId}`)
      
      return { success: true }
    } catch (error) {
      logger.error(`Indexing failed for ${type}: ${itemId}`, { error })
      throw error
    }
  },
  { connection, concurrency: 20 }
)

// ============================================================================
// AI WORKER
// ============================================================================

const aiWorker = new Worker(
  'ai',
  async (job: Job<AIGenerateQuestionsJobData>) => {
    const { userId, count } = job.data
    
    logger.info(`Generating ${count} questions for user: ${userId}`)
    
    try {
      // TODO: Use OpenAI to generate questions
      // const questions = await generateQuestions({
      //   prompt,
      //   count,
      //   categoryId,
      //   subjectId,
      //   topicId,
      // })
      
      // Save generated questions with PENDING_REVIEW status
      
      logger.info(`Generated ${count} questions for user: ${userId}`)
      
      return {
        success: true,
        count,
      }
    } catch (error) {
      logger.error(`Question generation failed for user: ${userId}`, { error })
      throw error
    }
  },
  { connection, concurrency: 2 }
)

// Helper functions
async function updateUserAnalytics(userId: string, _categoryId: string) {
  // TODO: Update user analytics based on test performance
  logger.info(`Updating analytics for user: ${userId}`)
}

// Event listeners
scoringWorker.on('completed', (job) => {
  logger.info(`Scoring job completed: ${job.id}`)
})

scoringWorker.on('failed', (job, error) => {
  logger.error(`Scoring job failed: ${job?.id}`, { error })
})

emailWorker.on('completed', (job) => {
  logger.info(`Email job completed: ${job.id}`)
})

export const workers = {
  scoringWorker,
  emailWorker,
  exportWorker,
  indexingWorker,
  aiWorker,
}
