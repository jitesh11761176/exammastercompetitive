import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { clarifyDoubt } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { question, context } = await request.json()

    const answer = await clarifyDoubt(question, context)

    return NextResponse.json({ answer })
  } catch (error) {
    console.error('Error clarifying doubt:', error)
    return NextResponse.json(
      { error: 'Failed to clarify doubt' },
      { status: 500 }
    )
  }
}
