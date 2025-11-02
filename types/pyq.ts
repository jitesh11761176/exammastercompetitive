export interface PYQCollection {
  id: string
  examId: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  startYear: number
  endYear: number
  price: number
  isPremium: boolean
  isFree: boolean
  totalPapers: number
  totalQuestions: number
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
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
    pyqYear: number | null
    totalQuestions: number
    duration: number
    isLocked: boolean
  }>
}

export interface PYQCard {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  startYear: number
  endYear: number
  price: number
  isPremium: boolean
  isFree: boolean
  totalPapers: number
  totalQuestions: number
  exam: {
    name: string
    category: {
      name: string
    }
  }
}
