import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { searchQuestions, searchTests } from '@/lib/search/meilisearch-client'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'all' // questions, tests, all
    const categoryId = searchParams.get('categoryId') || undefined
    const difficulty = searchParams.get('difficulty') || undefined
    const limit = parseInt(searchParams.get('limit') || '20')

    const results: any = {}

    if (type === 'all' || type === 'questions') {
      results.questions = await searchQuestions(query, {
        categoryId,
        difficulty,
      }, limit)
    }

    if (type === 'all' || type === 'tests') {
      results.tests = await searchTests(query, {
        categoryId,
        difficulty,
      }, limit)
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
