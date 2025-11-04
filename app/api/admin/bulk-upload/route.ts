import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Papa from 'papaparse'
import { parseExamContent, convertToDBFormat } from '@/lib/question-parser'

// Helper: slugify
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')

// Resolve category, and optionally map via course
async function resolveCategoryAndTopic(opts: {
  categoryId?: string | null
  courseId?: string | null
  subjectName?: string
  topicName?: string
}) {
  const { categoryId, courseId } = opts
  const subjectName = opts.subjectName || 'General Knowledge'
  const topicName = opts.topicName || 'General'

  // Resolve Course if provided
  let resolvedCourse: any = null
  if (courseId) {
    resolvedCourse = await prisma.course.findUnique({ where: { id: courseId } })
  }

  // Category preference: provided -> by course -> fallback to default course
  let category = categoryId ? await prisma.category.findUnique({ where: { id: categoryId } }) : null
  if (!category) {
    // If we have a course, find or create category under that course
    if (resolvedCourse) {
      const preferredCategoryName = 'Bulk Upload'
      const preferredSlug = slugify(preferredCategoryName)
      category = await prisma.category.findFirst({ 
        where: { slug: preferredSlug, courseId: resolvedCourse.id } 
      })
      if (!category) {
        category = await prisma.category.create({
          data: {
            name: preferredCategoryName,
            slug: preferredSlug,
            description: 'Auto-created for bulk uploads',
            isActive: true,
            courseId: resolvedCourse.id,
          }
        })
      }
    } else {
      // No course provided - find or create a default course
      let defaultCourse = await prisma.course.findFirst({
        where: { slug: 'bulk-upload' }
      })
      if (!defaultCourse) {
        defaultCourse = await prisma.course.create({
          data: {
            title: 'Bulk Upload',
            slug: 'bulk-upload',
            description: 'Questions uploaded via bulk upload',
            isActive: true,
            isFree: true,
            order: 996,
          }
        })
      }
      
      const preferredCategoryName = 'General'
      const preferredSlug = slugify(preferredCategoryName)
      category = await prisma.category.findFirst({ 
        where: { slug: preferredSlug, courseId: defaultCourse.id } 
      })
      if (!category) {
        category = await prisma.category.create({
          data: {
            name: preferredCategoryName,
            slug: preferredSlug,
            description: 'Auto-created for bulk uploads',
            isActive: true,
            courseId: defaultCourse.id,
          }
        })
      }
    }
  }

  // Subject under Category
  let subject = await prisma.subject.findFirst({ where: { categoryId: category!.id, name: subjectName } })
  if (!subject) {
    subject = await prisma.subject.create({
      data: {
        categoryId: category!.id,
        name: subjectName,
        slug: slugify(subjectName),
        isActive: true,
      }
    })
  }

  // Topic under Subject
  let topic = await prisma.topic.findFirst({ where: { subjectId: subject.id, name: topicName } })
  if (!topic) {
    topic = await prisma.topic.create({
      data: {
        subjectId: subject.id,
        name: topicName,
        slug: slugify(topicName),
        isActive: true,
      }
    })
  }

  return { category, subject, topic }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // @ts-ignore
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    const autoTag = String(form.get('autoTag') || 'false') === 'true'
    const categoryId = (form.get('categoryId') as string) || undefined
    const courseId = (form.get('courseId') as string) || undefined
    const subjectName = (form.get('subject') as string) || undefined
    const topicName = (form.get('topic') as string) || undefined

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024
    if ((file as any).size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 413 })
    }

    const filename = (file as any).name || 'upload'
    const type = file.type || ''
    const ext = filename.split('.').pop()?.toLowerCase()

    let extractedQuestions: any[] = []

    if (type.includes('pdf') || ext === 'pdf') {
      const arr = await file.arrayBuffer()
      const buffer = Buffer.from(arr)
  const pdfParseMod = await import('pdf-parse')
  const pdfParseFn: any = (pdfParseMod as any).default || (pdfParseMod as any)
  const parsed = await pdfParseFn(buffer)
      const text = parsed.text || ''
      const parsedQs = parseExamContent(text)
      extractedQuestions = convertToDBFormat(parsedQs)
    } else if (type.includes('csv') || ext === 'csv') {
      const text = await file.text()
      const parsed = Papa.parse(text, { header: true })
      if (parsed.errors?.length) {
        return NextResponse.json({ error: 'CSV parse error', details: parsed.errors }, { status: 400 })
      }
  extractedQuestions = (parsed.data as any[]).filter(Boolean).map((row) => ({
        questionText: row.question || row.Question || '',
        optionA: row.optionA || row.A || row.OptionA || null,
        optionB: row.optionB || row.B || row.OptionB || null,
        optionC: row.optionC || row.C || row.OptionC || null,
        optionD: row.optionD || row.D || row.OptionD || null,
        correctOption: (row.answer || row.Answer || '').toString().trim().toUpperCase() || null,
        explanation: row.explanation || row.Explanation || '',
        difficulty: (row.difficulty || row.Difficulty || 'MEDIUM').toString().toUpperCase(),
        marks: Number(row.marks || row.Marks || 1),
        negativeMarks: Number(row.negativeMarks || row.NegativeMarks || 0),
        subject: row.subject || row.Subject || subjectName || 'General Knowledge',
        topic: row.topic || row.Topic || topicName || 'General',
        questionType: 'MCQ',
      }))
    } else if ((type.startsWith('image/') || ['png','jpg','jpeg','webp'].includes(ext || ''))) {
      return NextResponse.json({ error: 'Image OCR is not enabled yet' }, { status: 400 })
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    // Optionally persist to DB
    let createdCount = 0
    let placement: any = null
    if (autoTag && extractedQuestions.length) {
      // Resolve placement once; then create all questions under that topic
      const first = extractedQuestions[0]
      const resolved = await resolveCategoryAndTopic({
        categoryId,
        courseId,
        subjectName: subjectName || first.subject,
        topicName: topicName || first.topic,
      })
      placement = { categoryId: resolved.category!.id, subjectId: resolved.subject!.id, topicId: resolved.topic!.id }

      // Create questions in DB
      for (const q of extractedQuestions) {
        const correctOption = (q.correctOption || '').toString().trim().toUpperCase() || null
        await prisma.question.create({
          data: {
            topicId: resolved.topic!.id,
            questionText: q.questionText || '',
            questionType: 'MCQ',
            optionA: q.optionA || null,
            optionB: q.optionB || null,
            optionC: q.optionC || null,
            optionD: q.optionD || null,
            correctOption: correctOption,
            explanation: q.explanation || `The correct answer is option ${correctOption}.`,
            difficulty: (q.difficulty || 'MEDIUM'),
            marks: Number(q.marks || 1),
            negativeMarks: Number(q.negativeMarks || 0),
            isVerified: false,
            moderationStatus: 'PENDING',
          }
        })
        createdCount++
      }
    }

    return NextResponse.json({
      success: true,
      file: { name: filename, type, size: (file as any).size },
      questions: extractedQuestions,
      created: createdCount,
      placement,
    })
  } catch (error) {
    console.error('Bulk upload error:', error)
    return NextResponse.json({ error: 'Failed to process bulk upload' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds for large file processing
// Note: removed deprecated `export const config` (Next.js now uses route segment config).
// The route still exports `dynamic` and `runtime` above.
