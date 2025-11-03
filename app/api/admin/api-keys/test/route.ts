import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { geminiKey } = await request.json()

    if (!geminiKey) {
      return NextResponse.json(
        { success: false, message: 'API key is required' },
        { status: 400 }
      )
    }

    // Test the API key by making a simple request
    try {
      const genAI = new GoogleGenerativeAI(geminiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      const result = await model.generateContent('Hello! Just testing this API key. Respond with OK.')
      const response = await result.response
      const text = response.text()

      if (text) {
        return NextResponse.json({
          success: true,
          message: 'API key is valid and working! ✅'
        })
      } else {
        return NextResponse.json({
          success: false,
          message: 'API key responded but with empty content'
        })
      }
    } catch (apiError: any) {
      console.error('Gemini API error:', apiError)
      
      if (apiError.message?.includes('API_KEY_INVALID')) {
        return NextResponse.json({
          success: false,
          message: 'Invalid API key. Please check and try again.'
        })
      } else if (apiError.message?.includes('quota')) {
        return NextResponse.json({
          success: false,
          message: 'API key has exceeded quota/rate limit. Try another key.'
        })
      } else {
        return NextResponse.json({
          success: false,
          message: `API error: ${apiError.message || 'Unknown error'}`
        })
      }
    }
  } catch (error: any) {
    console.error('Error testing API key:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to test API key' },
      { status: 500 }
    )
  }
}
