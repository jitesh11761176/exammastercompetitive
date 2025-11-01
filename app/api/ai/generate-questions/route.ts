import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateQuestions } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { topic, count, difficulty } = await request.json()

    const questions = await generateQuestions(topic, count, difficulty)

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Error generating questions:', error)
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    )
  }
}
