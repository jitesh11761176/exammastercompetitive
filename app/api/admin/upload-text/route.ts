import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface ParsedQuestion {
  number: number
  text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  section?: string
  subject?: string
}

function parseKVSFormat(content: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []
  let currentSection = ''
  let currentSubject = ''
  
  // Split into lines
  const lines = content.split('\n').map(l => l.trim()).filter(l => l)
  
  // Extract answer key first
  const answerKeyMap = new Map<number, string>()
  const answerKeyStart = lines.findIndex(l => l.toUpperCase().includes('ANSWER KEY'))
  
  if (answerKeyStart !== -1) {
    console.log('📋 Found answer key at line', answerKeyStart)
    for (let i = answerKeyStart + 1; i < lines.length; i++) {
      const line = lines[i]
      // Parse format like "General English: 1-b, 2-d, 3-c"
      const match = line.match(/^([^:]+):\s*(.+)$/)
      if (match) {
        const subject = match[1].trim()
        const answers = match[2].split(',').map(a => a.trim())
        
        answers.forEach(answer => {
          const parts = answer.split('-')
          if (parts.length === 2) {
            const num = parseInt(parts[0])
            const ans = parts[1].toUpperCase()
            if (!isNaN(num)) {
              answerKeyMap.set(num, ans)
            }
          }
        })
      }
    }
    console.log(`✅ Extracted ${answerKeyMap.size} answers from answer key`)
  }
  
  // Parse questions
  let i = 0
  while (i < lines.length && i < answerKeyStart) {
    const line = lines[i]
    
    // Detect section/subject headers
    if (line.includes('PART') || line.includes('SECTION')) {
      if (line.includes('SECTION')) {
        const sectionMatch = line.match(/SECTION [A-Z]:\s*(.+)/i)
        if (sectionMatch) {
          currentSubject = sectionMatch[1].replace(/\(.+\)/, '').trim()
        }
      }
      i++
      continue
    }
    
    // Skip header/title lines
    if (line.length > 100 || line.includes('Duration:') || line.includes('Total Questions')) {
      i++
      continue
    }
    
    // Detect question number (1., 2., etc.)
    const questionMatch = line.match(/^(\d+)\.\s+(.+)$/)
    if (questionMatch) {
      const questionNum = parseInt(questionMatch[1])
      let questionText = questionMatch[2]
      
      // Continue reading question text if it spans multiple lines
      i++
      while (i < lines.length && !lines[i].match(/^\([a-d]\)/i) && !lines[i].match(/^\d+\./)) {
        if (!lines[i].includes('ANSWER') && !lines[i].includes('SECTION')) {
          questionText += ' ' + lines[i]
        }
        i++
      }
      
      // Extract options
      const options: string[] = []
      for (let optIdx = 0; optIdx < 4; optIdx++) {
        if (i < lines.length) {
          const optionMatch = lines[i].match(/^\(([a-d])\)\s*(.+)$/i)
          if (optionMatch) {
            options.push(optionMatch[2].trim())
            i++
          } else {
            break
          }
        }
      }
      
      // Only add if we have all 4 options
      if (options.length === 4) {
        const correctAnswer = answerKeyMap.get(questionNum) || 'A'
        
        questions.push({
          number: questionNum,
          text: questionText.trim(),
          optionA: options[0],
          optionB: options[1],
          optionC: options[2],
          optionD: options[3],
          correctAnswer,
          subject: currentSubject || 'General',
          section: currentSection
        })
      }
      
      continue
    }
    
    i++
  }
  
  return questions
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ 
        success: false,
        message: 'Unauthorized - Admin access required' 
      }, { status: 401 })
    }

    const { content, categoryName, examTitle } = await request.json()
    
    if (!content) {
      return NextResponse.json({ 
        success: false,
        message: 'No content provided' 
      }, { status: 400 })
    }

    console.log('📝 Parsing text content...')
    console.log('Content length:', content.length)
    
    const parsedQuestions = parseKVSFormat(content)
    
    if (parsedQuestions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No questions found. Please ensure your content follows the format:\n1. Question?\n(a) Option A\n(b) Option B...\n\nANSWER KEY\nSubject: 1-a, 2-b...' 
      })
    }

    console.log(`✅ Found ${parsedQuestions.length} questions`)

    // Create or get category
    const category = await prisma.category.upsert({
      where: { name: categoryName || 'General' },
      create: {
        name: categoryName || 'General',
        slug: (categoryName || 'General').toLowerCase().replace(/\s+/g, '-'),
        description: `Uploaded via Smart Parser on ${new Date().toLocaleDateString()}`,
        isActive: true
      },
      update: {}
    })

    console.log(`✅ Using category: ${category.name}`)

    // Group questions by subject
    const questionsBySubject = new Map<string, ParsedQuestion[]>()
    parsedQuestions.forEach(q => {
      const subject = q.subject || 'General'
      if (!questionsBySubject.has(subject)) {
        questionsBySubject.set(subject, [])
      }
      questionsBySubject.get(subject)!.push(q)
    })

    // Create subjects and questions
    let totalCreated = 0
    const createdQuestionIds: string[] = []
    
    for (const [subjectName, questions] of questionsBySubject) {
      const subject = await prisma.subject.upsert({
        where: { 
          name_categoryId: {
            name: subjectName,
            categoryId: category.id
          }
        },
        create: {
          name: subjectName,
          slug: subjectName.toLowerCase().replace(/\s+/g, '-'),
          categoryId: category.id,
          isActive: true
        },
        update: {}
      })

      console.log(`✅ Created/found subject: ${subjectName}`)

      // Create questions
      for (const q of questions) {
        const question = await prisma.question.create({
          data: {
            questionText: q.text,
            questionType: 'MCQ',
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctOption: q.correctAnswer,
            explanation: `The correct answer is option ${q.correctAnswer}.`,
            marks: 1,
            negativeMarks: 0.25,
            difficulty: 'MEDIUM',
            categoryId: category.id,
            subjectId: subject.id,
            isActive: true
          }
        })
        createdQuestionIds.push(question.id)
        totalCreated++
      }
    }

    console.log(`✅ Created ${totalCreated} questions`)

    // Create a test if exam title provided
    let testCreated = null
    if (examTitle && totalCreated > 0) {
      const test = await prisma.test.create({
        data: {
          title: examTitle,
          slug: examTitle.toLowerCase().replace(/\s+/g, '-'),
          description: `Auto-generated from Smart Parser on ${new Date().toLocaleDateString()}`,
          duration: Math.ceil(parsedQuestions.length * 0.75), // 45 seconds per question
          totalMarks: parsedQuestions.length,
          passingMarks: Math.ceil(parsedQuestions.length * 0.33),
          categoryId: category.id,
          isFree: true,
          isActive: true,
          testType: 'FULL_LENGTH',
          testQuestions: {
            create: createdQuestionIds.map((qId, index) => ({
              questionId: qId,
              order: index + 1
            }))
          }
        }
      })

      testCreated = test.title
      console.log(`✅ Created test: ${test.title}`)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${totalCreated} questions${testCreated ? ` and test "${testCreated}"` : ''}!`,
      data: {
        questionsCreated: totalCreated,
        category: categoryName || 'General',
        subjects: questionsBySubject.size,
        testCreated
      }
    })

  } catch (error: any) {
    console.error('❌ Text upload error:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Upload failed. Please check your content format.' 
    }, { status: 500 })
  }
}
