import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getNextBestTest,
  getWeakTopicRecommendations,
  getSpacedRepetitionRecommendations,
  getSimilarUserRecommendations,
} from '@/lib/recommendation-engine'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'all'

    const recommendations: any = {}

    if (type === 'all' || type === 'next_best_test') {
      recommendations.nextBestTest = await getNextBestTest(session.user.id)
    }

    if (type === 'all' || type === 'weak_topics') {
      recommendations.weakTopics = await getWeakTopicRecommendations(session.user.id)
    }

    if (type === 'all' || type === 'spaced_repetition') {
      recommendations.spacedRepetition = await getSpacedRepetitionRecommendations(session.user.id)
    }

    if (type === 'all' || type === 'similar_users') {
      recommendations.similarUsers = await getSimilarUserRecommendations(session.user.id)
    }

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error('Recommendations error:', error)
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    )
  }
}
