import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function calculateScore(
  correctAnswers: number,
  wrongAnswers: number,
  marksPerQuestion: number = 1,
  negativeMarking: number = 0.25
): number {
  return correctAnswers * marksPerQuestion - wrongAnswers * negativeMarking
}

export function calculatePercentage(score: number, totalMarks: number): number {
  return (score / totalMarks) * 100
}

export function calculateLevel(points: number): number {
  return Math.floor(Math.sqrt(points / 100)) + 1
}

export function getPointsForNextLevel(currentLevel: number): number {
  return (currentLevel * currentLevel) * 100
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    EASY: 'text-green-600 bg-green-100',
    MEDIUM: 'text-yellow-600 bg-yellow-100',
    HARD: 'text-red-600 bg-red-100',
  }
  return colors[difficulty] || 'text-gray-600 bg-gray-100'
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    IN_PROGRESS: 'text-blue-600 bg-blue-100',
    COMPLETED: 'text-green-600 bg-green-100',
    ABANDONED: 'text-gray-600 bg-gray-100',
  }
  return colors[status] || 'text-gray-600 bg-gray-100'
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
