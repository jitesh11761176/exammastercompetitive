export interface TestSeries {
  id: string
  examId: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  price: number
  discountPrice: number | null
  isPremium: boolean
  isFree: boolean
  validityDays: number
  totalTests: number
  totalQuestions: number
  enrolledCount: number
  features: string[] | null
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
  exam: {
    id: string
    name: string
    slug: string
    category: {
      id: string
      name: string
      slug: string
    }
  }
  tests?: Array<{
    id: string
    title: string
    slug: string
    duration: number
    totalQuestions: number
    isLocked: boolean
    order: number
  }>
  isEnrolled?: boolean
  enrollmentDetails?: {
    id: string
    status: string
    enrolledAt: Date
    expiresAt: Date
    completedTests: number
    averageScore: number
  }
}

export interface TestSeriesCard {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  price: number
  discountPrice: number | null
  isPremium: boolean
  isFree: boolean
  totalTests: number
  totalQuestions: number
  enrolledCount: number
  exam: {
    name: string
    category: {
      name: string
    }
  }
  isEnrolled?: boolean
}

export interface TestSeriesFilters {
  examCategory?: string
  exam?: string
  priceRange?: 'free' | 'paid' | 'all'
  sortBy?: 'popular' | 'newest' | 'price-low' | 'price-high'
  search?: string
}
