import { create } from 'zustand'

interface ExamState {
  currentQuestionIndex: number
  answers: Record<string, any>
  markedForReview: Set<string>
  timeRemaining: number
  isSubmitting: boolean
  
  setCurrentQuestion: (index: number) => void
  setAnswer: (questionId: string, answer: any) => void
  toggleMarkForReview: (questionId: string) => void
  setTimeRemaining: (time: number) => void
  setIsSubmitting: (isSubmitting: boolean) => void
  resetExam: () => void
}

export const useExamStore = create<ExamState>((set) => ({
  currentQuestionIndex: 0,
  answers: {},
  markedForReview: new Set(),
  timeRemaining: 0,
  isSubmitting: false,

  setCurrentQuestion: (index) => set({ currentQuestionIndex: index }),
  
  setAnswer: (questionId, answer) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    })),
  
  toggleMarkForReview: (questionId) =>
    set((state) => {
      const newSet = new Set(state.markedForReview)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return { markedForReview: newSet }
    }),
  
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  
  resetExam: () =>
    set({
      currentQuestionIndex: 0,
      answers: {},
      markedForReview: new Set(),
      timeRemaining: 0,
      isSubmitting: false,
    }),
}))
