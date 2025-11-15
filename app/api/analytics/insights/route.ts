import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getFirebaseFirestore } from '@/lib/firebase'
import { collection, doc, getDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getFirebaseFirestore()

    // Get user's analytics data
    const analyticsRef = doc(db, 'analytics', session.user.id)
    const progressQuery = query(
      collection(db, 'userProgress'),
      where('userId', '==', session.user.id),
      orderBy('attemptedAt', 'desc'),
      limit(1000)
    )
    const testsQuery = query(
      collection(db, 'testAttempts'),
      where('userId', '==', session.user.id),
      where('status', '==', 'COMPLETED'),
      orderBy('endTime', 'desc'),
      limit(5)
    )

    const [analyticsSnap, progressSnap, testsSnap] = await Promise.all([
      getDoc(analyticsRef),
      getDocs(progressQuery),
      getDocs(testsQuery),
    ])

    const analytics = analyticsSnap.exists() ? analyticsSnap.data() : null

    const progressRows = progressSnap.docs.map(d => d.data())
    for (const row of progressRows) {
      if (row.questionId) {
        const questionSnap = await getDoc(doc(db, 'questions', row.questionId))
        if (questionSnap.exists()) {
          const questionData = questionSnap.data()
          row.question = questionData
          if (questionData.topicId) {
            const topicSnap = await getDoc(doc(db, 'topics', questionData.topicId))
            if (topicSnap.exists()) {
              const topicData = topicSnap.data()
              row.question.topic = topicData
              if (topicData.subjectId) {
                const subjectSnap = await getDoc(doc(db, 'subjects', topicData.subjectId))
                if (subjectSnap.exists()) {
                  row.question.topic.subject = subjectSnap.data()
                }
              }
            }
          }
        }
      }
    }

    const recentTests = testsSnap.docs.map(d => d.data())
    for (const t of recentTests) {
      if (t.testId) {
        const testSnap = await getDoc(doc(db, 'tests', t.testId))
        if (testSnap.exists()) {
          const testData = testSnap.data()
          t.test = {
            title: testData.title,
            difficulty: testData.difficulty,
          }
        }
      }
    }

    // Aggregate progress by topic
    type Agg = {
      topicId: string
      topicName: string
      subjectId: string
      subjectName: string
      totalQuestions: number
      correctAnswers: number
      accuracy: number
      lastPracticed: Date | null
    }

    const byTopic = new Map<string, Agg>()
    for (const row of progressRows as any[]) {
      const topic = row.question?.topic
      if (!topic) continue
      const key = topic.id
      const ex = byTopic.get(key)
      const agg: Agg = ex ?? {
        topicId: topic.id,
        topicName: topic.name,
        subjectId: topic.subject?.id ?? '',
        subjectName: topic.subject?.name ?? '',
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        lastPracticed: null,
      }
      agg.totalQuestions += 1
      if (row.isCorrect) agg.correctAnswers += 1
      const ts = row.attemptedAt ? new Date(row.attemptedAt) : null
      if (ts && (!agg.lastPracticed || ts > agg.lastPracticed)) agg.lastPracticed = ts
      byTopic.set(key, agg)
    }
    const userProgressAgg: Agg[] = Array.from(byTopic.values()).map((p) => ({
      ...p,
      accuracy: p.totalQuestions > 0 ? Math.round((p.correctAnswers / p.totalQuestions) * 1000) / 10 : 0,
    }))

    // Prepare data for AI
    const performanceData = {
      overallAccuracy: analytics?.overallAccuracy || 0,
      totalTests: analytics?.totalTestsAttempted || 0,
      avgSpeed: analytics?.averageSpeed || 0,
      weakTopics: userProgressAgg
        .filter((p) => p.accuracy < 60)
        .map((p) => ({
          topic: p.topicName,
          subject: p.subjectName,
          accuracy: p.accuracy,
          questionsAttempted: p.totalQuestions,
        })),
      strongTopics: userProgressAgg
        .filter((p) => p.accuracy >= 80)
        .sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 5)
        .map((p) => ({
          topic: p.topicName,
          subject: p.subjectName,
          accuracy: p.accuracy,
        })),
      recentPerformance: recentTests.map((t: any) => ({
        testName: t.test.title,
        difficulty: t.test.difficulty,
        percentage: t.accuracy,
        timeTaken: t.timeTaken,
      })),
    }

    // Create prompt for Gemini
    const prompt = `You are an expert educational advisor for competitive exams. Analyze the following student performance data and provide personalized insights and recommendations.

Student Performance Data:
${JSON.stringify(performanceData, null, 2)}

Please provide a comprehensive analysis in the following JSON format:
{
  "insights": [
    {
      "type": "strength" | "weakness" | "improvement" | "recommendation",
      "priority": "high" | "medium" | "low",
      "title": "Brief title (max 10 words)",
      "description": "Detailed explanation (2-3 sentences)",
      "actionItems": ["actionable step 1", "actionable step 2"]
    }
  ]
}

Guidelines:
1. Identify 2-3 key strengths based on strong topics
2. Highlight 2-3 critical weaknesses from weak topics
3. Suggest 3-4 specific improvement strategies
4. Provide 2-3 actionable recommendations
5. Prioritize insights by impact on overall performance
6. Be encouraging but realistic
7. Focus on actionable advice

Return only the JSON object, no additional text.`

  // Call Gemini AI
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse AI response
    let insights
    try {
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleanText)
      insights = parsed.insights
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      // Fallback insights
      insights = [
        {
          type: 'recommendation',
          priority: 'high',
          title: 'Keep Practicing Regularly',
          description:
            'Based on your performance data, consistent practice will help improve your scores. Focus on weak areas while maintaining strong topics.',
          actionItems: [
            'Practice at least 30 minutes daily',
            'Review incorrect answers',
            'Take regular mock tests',
          ],
        },
      ]
    }

    return NextResponse.json({ insights })
  } catch (error) {
    console.error('Error generating insights:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}

