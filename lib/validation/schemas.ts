import { z } from 'zod'

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const userRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
})

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const userUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  image: z.string().url().optional(),
})

// ============================================================================
// QUESTION SCHEMAS
// ============================================================================

export const questionBaseSchema = z.object({
  questionText: z.string().min(10, 'Question must be at least 10 characters'),
  topicId: z.string().cuid('Invalid topic ID'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  marks: z.number().int().positive(),
  negativeMarks: z.number().min(0).optional(),
  explanation: z.string().min(10).optional(),
  solution: z.string().optional(),
  mathContent: z.string().optional(),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
})

export const mcqQuestionSchema = questionBaseSchema.extend({
  questionType: z.literal('MCQ'),
  options: z.array(z.string()).length(4, 'MCQ must have exactly 4 options'),
  correctOptions: z.array(z.number()).length(1, 'MCQ must have exactly 1 correct answer'),
})

export const msqQuestionSchema = questionBaseSchema.extend({
  questionType: z.literal('MSQ'),
  options: z.array(z.string()).min(2).max(6, 'MSQ can have 2-6 options'),
  correctOptions: z.array(z.number()).min(1, 'MSQ must have at least 1 correct answer'),
  partialMarking: z.boolean().default(true),
})

export const integerQuestionSchema = questionBaseSchema.extend({
  questionType: z.literal('INTEGER'),
  correctAnswer: z.number().int(),
  options: z.array(z.string()).length(0).default([]),
  correctOptions: z.array(z.number()).length(0).default([]),
})

export const rangeQuestionSchema = questionBaseSchema.extend({
  questionType: z.literal('RANGE'),
  minValue: z.number(),
  maxValue: z.number(),
  options: z.array(z.string()).length(0).default([]),
  correctOptions: z.array(z.number()).length(0).default([]),
}).refine((data) => data.minValue < data.maxValue, {
  message: 'Min value must be less than max value',
  path: ['minValue'],
})

export const subjectiveQuestionSchema = questionBaseSchema.extend({
  questionType: z.literal('SUBJECTIVE'),
  maxWords: z.number().int().positive().optional(),
  rubric: z.record(z.number()).optional(),
  options: z.array(z.string()).length(0).default([]),
  correctOptions: z.array(z.number()).length(0).default([]),
})

export const questionSchema = z.union([
  mcqQuestionSchema,
  msqQuestionSchema,
  integerQuestionSchema,
  rangeQuestionSchema,
  subjectiveQuestionSchema,
])

// ============================================================================
// TEST SCHEMAS
// ============================================================================

export const testSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().max(1000).optional(),
  categoryId: z.string().cuid('Invalid category ID'),
  testType: z.enum(['MOCK', 'PRACTICE', 'PREVIOUS_YEAR', 'TOPIC_WISE', 'SECTIONAL']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'MIXED']).optional(),
  duration: z.number().int().positive('Duration must be positive'),
  totalMarks: z.number().positive('Total marks must be positive'),
  totalQuestions: z.number().int().positive('Must have at least 1 question'),
  passingMarks: z.number().min(0).optional(),
  negativeMarking: z.boolean().default(false),
  shuffleQuestions: z.boolean().default(false),
  showAnswers: z.boolean().default(true),
  solutionsAvailableAt: z.date().optional(),
  maxAttempts: z.number().int().positive().default(1),
  isFree: z.boolean().default(false),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
})

export const testSectionSchema = z.object({
  testId: z.string().cuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  duration: z.number().int().positive().optional(),
  order: z.number().int().min(0),
  canSkipSection: z.boolean().default(false),
})

// ============================================================================
// ANSWER SCHEMAS
// ============================================================================

export const submitAnswerSchema = z.object({
  testAttemptId: z.string().cuid(),
  questionId: z.string().cuid(),
  selectedOptions: z.array(z.number()).min(0),
  textAnswer: z.string().optional(),
  timeTaken: z.number().int().min(0).optional(),
})

export const submitTestSchema = z.object({
  testAttemptId: z.string().cuid(),
  answers: z.array(submitAnswerSchema),
  timeTaken: z.number().int().positive(),
})

// ============================================================================
// SUBSCRIPTION SCHEMAS
// ============================================================================

export const subscriptionSchema = z.object({
  planId: z.enum(['BASIC', 'PREMIUM', 'ULTIMATE']),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']),
})

export const applyCouponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
})

// ============================================================================
// STUDY PLANNER SCHEMAS
// ============================================================================

export const studyGoalSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  targetDate: z.date().min(new Date(), 'Target date must be in the future'),
  hoursPerWeek: z.number().int().min(1).max(168),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  categoryIds: z.array(z.string().cuid()).min(1),
})

export const studySessionSchema = z.object({
  goalId: z.string().cuid().optional(),
  categoryId: z.string().cuid(),
  duration: z.number().int().positive(),
  topicsCovered: z.array(z.string()),
  notes: z.string().max(2000).optional(),
})

// ============================================================================
// AI SCHEMAS
// ============================================================================

export const chatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  questionId: z.string().cuid().optional(),
  sessionId: z.string().cuid().optional(),
})

export const generateQuestionsSchema = z.object({
  prompt: z.string().min(10).max(1000),
  count: z.number().int().min(1).max(50),
  categoryId: z.string().cuid(),
  subjectId: z.string().cuid(),
  topicId: z.string().cuid(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  questionType: z.enum(['MCQ', 'MSQ', 'INTEGER', 'RANGE', 'SUBJECTIVE']).optional(),
})

export const requestHintSchema = z.object({
  questionId: z.string().cuid(),
  level: z.number().int().min(1).max(3),
})

// ============================================================================
// SEARCH SCHEMAS
// ============================================================================

export const searchSchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(['questions', 'tests', 'all']).default('all'),
  categoryId: z.string().cuid().optional(),
  subjectId: z.string().cuid().optional(),
  topicId: z.string().cuid().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
})

// ============================================================================
// ADMIN SCHEMAS
// ============================================================================

export const bulkImportSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.type === 'text/csv' || file.name.endsWith('.csv'),
    'File must be a CSV'
  ),
})

export const moderationActionSchema = z.object({
  questionId: z.string().cuid(),
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES']),
  feedback: z.string().max(500).optional(),
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Validate and parse with error handling
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, errors: result.error }
  }
}

// Format Zod errors for API response
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {}
  
  error.errors.forEach((err) => {
    const path = err.path.join('.')
    formatted[path] = err.message
  })
  
  return formatted
}
