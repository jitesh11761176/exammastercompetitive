import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Papa from 'papaparse'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or creator
    const userRole = (session.user as any).role || 'STUDENT'
    if (userRole !== 'ADMIN' && userRole !== 'CREATOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const text = await file.text()
    const parsed = Papa.parse(text, { header: true })
    
    const errors: string[] = []
    let successCount = 0

    for (let i = 0; i < parsed.data.length; i++) {
      const row: any = parsed.data[i]
      
      // Skip empty rows
      if (!row.topicId || !row.questionText) continue

      try {
        await prisma.question.create({
          data: {
            topicId: row.topicId,
            questionText: row.questionText,
            questionImage: row.questionImage || null,
            optionA: row.optionA,
            optionB: row.optionB,
            optionC: row.optionC,
            optionD: row.optionD,
            correctOption: row.correctOption,
            explanation: row.explanation,
            difficulty: row.difficulty || 'MEDIUM',
            marks: parseFloat(row.marks) || 1.0,
            negativeMarks: parseFloat(row.negativeMarks) || 0.25,
            timeToSolve: parseInt(row.timeToSolve) || 60,
            tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
          },
        })
        successCount++
      } catch (error: any) {
        errors.push(`Row ${i + 2}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: successCount,
      errors,
    })
  } catch (error: any) {
    console.error('CSV import error:', error)
    return NextResponse.json(
      { error: 'Failed to process CSV file' },
      { status: 500 }
    )
  }
}
