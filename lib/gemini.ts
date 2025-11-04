import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from './prisma'

// Function to get the current API key from database (runtime) or environment
async function getGeminiAPIKey(): Promise<string> {
  try {
    // Try to get from database first (allows runtime updates)
    const settings = await prisma.platformSettings.findUnique({
      where: { category: 'ai' }
    })
    
    if (settings?.geminiApiKey) {
      return settings.geminiApiKey
    }
  } catch (error) {
    console.error('Error reading Gemini API key from database:', error)
  }
  
  // Fallback to environment variable
  return process.env.GEMINI_API_KEY || ''
}

// Create a function to get the AI instance with the latest key
async function getGenAI() {
  const apiKey = await getGeminiAPIKey()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Please set it in the admin panel.')
  }
  return new GoogleGenerativeAI(apiKey)
}

export async function generateQuestions(
  topic: string,
  count: number = 10,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM'
) {
  const genAI = await getGenAI()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })

  const prompt = `Generate ${count} multiple-choice questions about ${topic} with ${difficulty.toLowerCase()} difficulty.

Format each question as a JSON object with the following structure:
{
  "questionText": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "Option A",
  "explanation": "Why this answer is correct",
  "subject": "${topic}",
  "difficulty": "${difficulty}"
}

Return ONLY a valid JSON array of ${count} questions, nothing else.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response')
    }
    
    const questions = JSON.parse(jsonMatch[0])
    return questions
  } catch (error) {
    console.error('Error generating questions:', error)
    throw error
  }
}

export async function clarifyDoubt(question: string, context?: string) {
  const genAI = await getGenAI()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })

  const prompt = `You are an expert tutor helping students prepare for competitive exams.

Student's question: ${question}

${context ? `Context: ${context}` : ''}

Provide a clear, concise, and helpful explanation. Use examples where appropriate.
Keep your response focused and easy to understand.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Error clarifying doubt:', error)
    throw error
  }
}

export async function getPerformanceInsights(_userId: string) {
  const genAI = await getGenAI()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })

  // TODO: Fetch actual user stats from database
  // This is a placeholder implementation
  const userStats = {
    totalTests: 0,
    averageScore: 0,
    strongSubjects: ['N/A'],
    weakSubjects: ['N/A'],
    recentTrend: 'No data available'
  }

  const prompt = `Analyze this student's performance and provide actionable insights:

Total Tests Taken: ${userStats.totalTests}
Average Score: ${userStats.averageScore}%
Strong Subjects: ${userStats.strongSubjects.join(', ')}
Weak Subjects: ${userStats.weakSubjects.join(', ')}
Recent Trend: ${userStats.recentTrend}

Provide:
1. Overall assessment (2-3 sentences)
2. Top 3 strengths
3. Top 3 areas for improvement
4. 3 specific actionable recommendations

Keep it motivating and constructive.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Error getting performance insights:', error)
    throw error
  }
}
