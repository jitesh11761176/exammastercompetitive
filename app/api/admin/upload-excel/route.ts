import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ 
        success: false,
        message: 'Unauthorized - Admin access required' 
      }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ 
        success: false,
        message: 'No file uploaded' 
      }, { status: 400 })
    }

    console.log('📊 Excel upload started:', file.name, file.type, file.size)

    // Read file content
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ 
        success: false, 
        message: 'File is empty or has no data rows. Please use the template.' 
      })
    }

    // Skip header row
    const dataLines = lines.slice(1)
    
    const questions: any[] = []
    let categoryName = ''
    const subjectsSet = new Set<string>()

    console.log(`Processing ${dataLines.length} rows...`)

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i]
      
      // Parse CSV line (handle quoted fields with commas inside)
      const fields: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        
        if (char === '"') {
          if (inQuotes && line[j + 1] === '"') {
            // Escaped quote
            current += '"'
            j++
          } else {
            // Toggle quote state
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          // Field separator
          fields.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      fields.push(current.trim()) // Last field

      if (fields.length < 11) {
        console.log(`⚠️ Row ${i + 2} skipped: not enough columns (${fields.length})`)
        continue // Skip invalid rows
      }

      const [
        , // questionNum - not used
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        explanation,
        subject,
        topic,
        category,
        marks,
        difficulty
      ] = fields

      // Validate required fields
      if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
        console.log(`⚠️ Row ${i + 2} skipped: missing required fields`)
        continue
      }

      // Validate correct answer
      const answer = correctAnswer.trim().toUpperCase()
      if (!['A', 'B', 'C', 'D'].includes(answer)) {
        console.log(`⚠️ Row ${i + 2} skipped: invalid answer "${correctAnswer}" (must be A, B, C, or D)`)
        continue
      }

      categoryName = category?.trim() || categoryName || 'General'
      const subjectName = subject?.trim() || 'General Knowledge'
      if (subjectName) subjectsSet.add(subjectName)

      const difficultyValue = (difficulty?.trim().toUpperCase() || 'MEDIUM')
      const validDifficulty = ['EASY', 'MEDIUM', 'HARD'].includes(difficultyValue) 
        ? difficultyValue 
        : 'MEDIUM'

      questions.push({
        questionText: questionText.trim(),
        optionA: optionA.trim(),
        optionB: optionB.trim(),
        optionC: optionC.trim(),
        optionD: optionD.trim(),
        correctAnswer: answer,
        explanation: explanation?.trim() || `The correct answer is option ${answer}.`,
        subject: subjectName,
        topic: topic?.trim() || '',
        marks: parseInt(marks) || 1,
        difficulty: validDifficulty
      })
    }

    if (questions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No valid questions found in file. Please check the format and ensure all required fields are filled.' 
      })
    }

    console.log(`✅ Parsed ${questions.length} valid questions`)

    // Create or get category
    let category = await prisma.category.findFirst({
      where: { name: categoryName }
    })

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: categoryName,
          slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
          description: `Uploaded via Excel on ${new Date().toLocaleDateString()}`,
          isActive: true
        }
      })
      console.log(`✅ Created category: ${categoryName}`)
    } else {
      console.log(`✅ Using existing category: ${categoryName}`)
    }

    // Create questions
    let questionsCreated = 0
    const subjectsCreated = new Set<string>()

    for (const q of questions) {
      // Create or get subject
      let subject = await prisma.subject.findFirst({
        where: { 
          name: q.subject,
          categoryId: category.id
        }
      })

      if (!subject) {
        subject = await prisma.subject.create({
          data: {
            name: q.subject,
            slug: q.subject.toLowerCase().replace(/\s+/g, '-'),
            categoryId: category.id,
            isActive: true
          }
        })
        subjectsCreated.add(q.subject)
      }

      // Create or get topic (always create one if not provided)
      const topicName = q.topic || 'General'
      let topic = await prisma.topic.findFirst({
        where: {
          name: topicName,
          subjectId: subject.id
        }
      })

      if (!topic) {
        topic = await prisma.topic.create({
          data: {
            name: topicName,
            slug: topicName.toLowerCase().replace(/\s+/g, '-'),
            subjectId: subject.id,
            difficulty: q.difficulty,
            isActive: true
          }
        })
      }

      // Create question
      await prisma.question.create({
        data: {
          questionText: q.questionText,
          questionType: 'MCQ',
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctAnswer,
          explanation: q.explanation,
          marks: q.marks,
          negativeMarks: 0.25, // Default negative marking
          difficulty: q.difficulty,
          topicId: topic.id,
          isActive: true
        }
      })

      questionsCreated++
    }

    console.log(`✅ Created ${questionsCreated} questions in ${subjectsCreated.size} subjects`)

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${questionsCreated} questions to category "${categoryName}"!`,
      data: {
        questionsCreated,
        category: categoryName,
        subjectsCreated: subjectsCreated.size
      }
    })

  } catch (error: any) {
    console.error('❌ Excel upload error:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Upload failed. Please check your file format.' 
    }, { status: 500 })
  }
}
