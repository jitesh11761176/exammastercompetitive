export interface Enrollment {
  id: string
  userId: string
  seriesId: string
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED'
  enrolledAt: Date
  expiresAt: Date
  lastAccessedAt: Date | null
  completedTests: number
  totalScore: number
  averageScore: number
  paymentId: string | null
  amountPaid: number
  createdAt: Date
  updatedAt: Date
  series: {
    id: string
    title: string
    slug: string
    thumbnail: string | null
    totalTests: number
    exam: {
      name: string
    }
  }
}

export interface EnrollmentProgress {
  totalTests: number
  completedTests: number
  averageScore: number
  totalScore: number
  completionPercentage: number
  lastAccessedAt: Date | null
}

export interface EnrollmentRequest {
  seriesId: string
  paymentId?: string
}

export interface EnrollmentResponse {
  success: boolean
  enrollment?: Enrollment
  message?: string
  error?: string
}
