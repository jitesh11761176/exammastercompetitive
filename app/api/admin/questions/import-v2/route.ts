import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
// PRISMA MIGRATION: import { prisma } from "@/lib/prisma"
import Papa from 'papaparse'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or creator
    const userRole = (session.user as any).role || 'STUDENT'
    if (userRole !== 'ADMIN' && userRole !== 'INSTRUCTOR') {
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
        const questionType = row.questionType || 'MCQ'
        
        // Parse tags
        const tags = row.tags ? row.tags.split(',').map((t: string) => t.trim()) : []
        
        // Parse correct options for MSQ
        const correctOptions = row.correctOptions 
          ? row.correctOptions.split(',').map((opt: string) => opt.trim())
          : []

        // Build question data based on type
        const questionData: any = {
          topicId: row.topicId,
          questionType: questionType,
          questionText: row.questionText,
          questionImage: row.questionImage || null,
          mathContent: row.mathContent || null,
          explanation: row.explanation || '',
          mathSolution: row.mathSolution || null,
          difficulty: row.difficulty || 'MEDIUM',
          marks: parseFloat(row.marks) || 1.0,
          negativeMarks: parseFloat(row.negativeMarks) || 0.25,
          partialMarking: row.partialMarking === 'true',
          timeToSolve: parseInt(row.timeToSolve) || 60,
          yearAsked: row.yearAsked ? parseInt(row.yearAsked) : null,
          examName: row.examName || null,
          tags: tags,
          createdBy: session.user.id,
          moderationStatus: 'PENDING',
        }

        // Add type-specific fields
        if (questionType === 'MCQ' || questionType === 'TRUE_FALSE') {
          questionData.optionA = row.optionA
          questionData.optionB = row.optionB
          questionData.optionC = row.optionC || null
          questionData.optionD = row.optionD || null
          questionData.correctOption = row.correctOption
        } else if (questionType === 'MSQ') {
          questionData.optionA = row.optionA
          questionData.optionB = row.optionB
          questionData.optionC = row.optionC
          questionData.optionD = row.optionD
          questionData.optionE = row.optionE || null
          questionData.optionF = row.optionF || null
          questionData.correctOptions = correctOptions
        } else if (questionType === 'INTEGER') {
          questionData.integerAnswer = parseInt(row.integerAnswer)
        } else if (questionType === 'RANGE') {
          questionData.rangeMin = parseFloat(row.rangeMin)
          questionData.rangeMax = parseFloat(row.rangeMax)
        }

        // Add partial marking rules if enabled
        if (row.partialMarking === 'true' && row.partialMarkingRules) {
          try {
            questionData.partialMarkingRules = JSON.parse(row.partialMarkingRules)
          } catch (e) {
            // Invalid JSON, skip
          }
        }

        // Add solution steps if provided
        if (row.solutionSteps) {
          try {
            questionData.solutionSteps = JSON.parse(row.solutionSteps)
          } catch (e) {
            // Invalid JSON, skip
          }
        }

        await prisma.question.create({
          data: questionData,
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

