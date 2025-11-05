// TypeScript type definitions for the application

export interface Question {
  id: string
  questionText: string
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'NUMERICAL'
  options?: string[]
  correctAnswer: string | string[]
  explanation?: string
  marks: number
  negativeMarks: number
  imageUrl?: string
  subject?: string
  topic?: string
  difficulty?: string
}

export interface Test {
  id: string
  title: string
  description?: string
  category: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  duration: number
  totalQuestions: number
  passingScore: number
  isPublic: boolean
  isPremium: boolean
  imageUrl?: string
  questions?: Question[]
  createdAt: Date
}

export interface TestAttempt {
  id: string
  userId: string
  testId: string
  startedAt: Date
  completedAt?: Date
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
  answers: Record<string, any>
  score?: number
  percentage?: number
  correctAnswers?: number
  wrongAnswers?: number
  skippedAnswers?: number
  timeTaken?: number
  rank?: number
  pointsEarned: number
}

export interface Badge {
  id: string
  name: string
  description: string
  imageUrl: string
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
  points: number
}

export interface UserStats {
  totalTests: number
  completedTests: number
  averageScore: number
  totalPoints: number
  level: number
  streak: number
  badges: number
}

export interface AnalyticsData {
  subjectWise: {
    subject: string
    score: number
    attempts: number
  }[]
  difficultyWise: {
    difficulty: string
    score: number
    attempts: number
  }[]
  performanceTrend: {
    date: string
    score: number
  }[]
}
