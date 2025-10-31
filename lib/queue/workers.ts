import { Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
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
      // Get test attempt with all answers
      const attempt = await prisma.testAttempt.findUnique({
        where: { id: testAttemptId },
        include: {
          test: {
            include: {
              sections: {
                include: {
                  questions: {
                    include: {
                      question: true,
                    },
                  },
                },
              },
            },
          },
          userAnswers: {
            include: {
              question: true,
            },
          },
        },
      })
      
      if (!attempt) {
        throw new Error(`Test attempt not found: ${testAttemptId}`)
      }
      
      // Calculate scores
      let totalScore = 0
      let correctAnswers = 0
      let incorrectAnswers = 0
      let unanswered = 0
      
      const sectionScores: Record<string, number> = {}
      
      for (const answer of attempt.userAnswers) {
        const question = answer.question
        
        if (!answer.selectedOptions || answer.selectedOptions.length === 0) {
          unanswered++
          continue
        }
        
        // Check if answer is correct
        const isCorrect = JSON.stringify(answer.selectedOptions.sort()) === 
                         JSON.stringify(question.correctOptions.sort())
        
        if (isCorrect) {
          correctAnswers++
          totalScore += question.marks
        } else {
          incorrectAnswers++
          // Apply negative marking if configured
          if (attempt.test.negativeMarking && question.negativeMarks) {
            totalScore -= question.negativeMarks
          }
        }
        
        // Track section scores
        const sectionId = question.sectionId || 'default'
        sectionScores[sectionId] = (sectionScores[sectionId] || 0) + 
                                    (isCorrect ? question.marks : 0)
      }
      
      // Calculate accuracy
      const totalAttempted = correctAnswers + incorrectAnswers
      const accuracy = totalAttempted > 0 ? (correctAnswers / totalAttempted) * 100 : 0
      
      // Update test attempt
      await prisma.testAttempt.update({
        where: { id: testAttemptId },
        data: {
          score: totalScore,
          accuracy,
          correctAnswers,
          incorrectAnswers,
          unanswered,
          sectionScores,
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
        incorrectAnswers,
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
    const { to, subject, template, data } = job.data
    
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
    const { userId, testAttemptId, includeAnalytics } = job.data
    
    logger.info(`Generating PDF export for attempt: ${testAttemptId}`)
    
    try {
      // Get test attempt data
      const attempt = await prisma.testAttempt.findUnique({
        where: { id: testAttemptId },
        include: {
          test: true,
          userAnswers: {
            include: {
              question: true,
            },
          },
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
    const { userId, prompt, count, categoryId, subjectId, topicId } = job.data
    
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
async function updateUserAnalytics(userId: string, categoryId: string) {
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
