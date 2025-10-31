import { Queue, Worker, Job as BullJob, QueueEvents } from 'bullmq'
import { Redis } from 'ioredis'
import { logger } from '../monitoring/logger'

// Redis connection
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

// Queue definitions
export const queues = {
  default: new Queue('default', { connection }),
  scoring: new Queue('scoring', { connection }),
  emails: new Queue('emails', { connection }),
  exports: new Queue('exports', { connection }),
  ai: new Queue('ai', { connection }),
  indexing: new Queue('indexing', { connection }),
}

// Job data types
export interface ScoreTestJobData {
  testAttemptId: string
  userId: string
}

export interface SendEmailJobData {
  to: string
  subject: string
  template: string
  data: Record<string, any>
}

export interface ExportPDFJobData {
  userId: string
  testAttemptId: string
  includeAnalytics: boolean
}

export interface IndexJobData {
  type: 'question' | 'test'
  itemId: string
}

export interface AIGenerateQuestionsJobData {
  userId: string
  prompt: string
  count: number
  categoryId: string
  subjectId: string
  topicId: string
}

// Add job to queue with retry logic
export async function addJob<T>(
  queueName: keyof typeof queues,
  jobName: string,
  data: T,
  options?: {
    priority?: number
    delay?: number
    attempts?: number
    backoff?: number
    removeOnComplete?: boolean
    removeOnFail?: boolean
  }
) {
  try {
    const job = await queues[queueName].add(jobName, data, {
      priority: options?.priority || 0,
      delay: options?.delay || 0,
      attempts: options?.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: options?.backoff || 2000,
      },
      removeOnComplete: options?.removeOnComplete !== false,
      removeOnFail: options?.removeOnFail || false,
    })

    logger.info(`Job added: ${jobName}`, {
      jobId: job.id,
      queue: queueName,
      data,
    })

    return job
  } catch (error) {
    logger.error(`Failed to add job: ${jobName}`, { error, data })
    throw error
  }
}

// Get job status
export async function getJobStatus(queueName: keyof typeof queues, jobId: string) {
  const job = await queues[queueName].getJob(jobId)
  
  if (!job) {
    return { status: 'not_found' }
  }
  
  const state = await job.getState()
  const progress = job.progress
  
  return {
    status: state,
    progress,
    data: job.data,
    result: job.returnvalue,
    failedReason: job.failedReason,
    attemptsMade: job.attemptsMade,
  }
}

// Queue metrics
export async function getQueueMetrics(queueName: keyof typeof queues) {
  const queue = queues[queueName]
  
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ])
  
  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  }
}

// Clean old jobs
export async function cleanQueue(
  queueName: keyof typeof queues,
  options: {
    grace?: number // milliseconds
    status?: 'completed' | 'failed'
  } = {}
) {
  const queue = queues[queueName]
  
  const cleaned = await queue.clean(
    options.grace || 24 * 60 * 60 * 1000, // 24 hours default
    100, // limit
    options.status || 'completed'
  )
  
  logger.info(`Cleaned queue: ${queueName}`, {
    cleaned: cleaned.length,
    status: options.status,
  })
  
  return cleaned
}

// Pause/Resume queue
export async function pauseQueue(queueName: keyof typeof queues) {
  await queues[queueName].pause()
  logger.info(`Queue paused: ${queueName}`)
}

export async function resumeQueue(queueName: keyof typeof queues) {
  await queues[queueName].resume()
  logger.info(`Queue resumed: ${queueName}`)
}

// Remove job
export async function removeJob(queueName: keyof typeof queues, jobId: string) {
  const job = await queues[queueName].getJob(jobId)
  if (job) {
    await job.remove()
    logger.info(`Job removed: ${jobId}`, { queue: queueName })
  }
}

// Retry failed job
export async function retryJob(queueName: keyof typeof queues, jobId: string) {
  const job = await queues[queueName].getJob(jobId)
  if (job) {
    await job.retry()
    logger.info(`Job retried: ${jobId}`, { queue: queueName })
  }
}
