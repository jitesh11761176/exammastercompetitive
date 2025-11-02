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
    const createTest = formData.get('createTest') === 'true'
    const testTitle = formData.get('testTitle') as string
    
    // Category handling
    const categoryMode = formData.get('categoryMode') as string
    const categoryId = formData.get('categoryId') as string
    const newCategoryName = formData.get('newCategoryName') as string
    const newCategoryDescription = formData.get('newCategoryDescription') as string
    const parentCategoryId = formData.get('parentCategoryId') as string
    const nestedCategoryName = formData.get('nestedCategoryName') as string
    
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

    // Handle category based on mode
    let category: any

    if (categoryMode === 'existing') {
      // Use existing category
      if (!categoryId) {
        return NextResponse.json({
          success: false,
          message: 'Please select a category'
        }, { status: 400 })
      }
      
      category = await prisma.category.findUnique({
        where: { id: categoryId }
      })
      
      if (!category) {
        return NextResponse.json({
          success: false,
          message: 'Selected category not found'
        }, { status: 404 })
      }
      
      console.log(`✅ Using existing category: ${category.name}`)
      
    } else if (categoryMode === 'new') {
      // Create new category
      if (!newCategoryName) {
        return NextResponse.json({
          success: false,
          message: 'Please provide a category name'
        }, { status: 400 })
      }
      
      const categorySlug = newCategoryName.toLowerCase().replace(/\s+/g, '-')
      
      // Check if category already exists
      const existingCategory = await prisma.category.findUnique({
        where: { slug: categorySlug }
      })
      
      if (existingCategory) {
        return NextResponse.json({
          success: false,
          message: `Category "${newCategoryName}" already exists. Please use a different name or select the existing category.`
        }, { status: 400 })
      }
      
      category = await prisma.category.create({
        data: {
          name: newCategoryName,
          slug: categorySlug,
          description: newCategoryDescription || `Created via Excel upload on ${new Date().toLocaleDateString()}`,
          isActive: true
        }
      })
      
      console.log(`✅ Created new category: ${category.name}`)
      
    } else if (categoryMode === 'nested') {
      // Create nested category (for now, we'll create it as a separate category with a reference in the name)
      // In the future, you might want to add a parentCategoryId field to the Category model
      if (!parentCategoryId || !nestedCategoryName) {
        return NextResponse.json({
          success: false,
          message: 'Please select a parent category and provide a subcategory name'
        }, { status: 400 })
      }
      
      const parentCategory = await prisma.category.findUnique({
        where: { id: parentCategoryId }
      })
      
      if (!parentCategory) {
        return NextResponse.json({
          success: false,
          message: 'Parent category not found'
        }, { status: 404 })
      }
      
      // Create nested category with parent name prefix
      const fullCategoryName = `${parentCategory.name} - ${nestedCategoryName}`
      const categorySlug = fullCategoryName.toLowerCase().replace(/\s+/g, '-')
      
      // Check if nested category already exists
      const existingCategory = await prisma.category.findUnique({
        where: { slug: categorySlug }
      })
      
      if (existingCategory) {
        category = existingCategory
        console.log(`✅ Using existing nested category: ${category.name}`)
      } else {
        category = await prisma.category.create({
          data: {
            name: fullCategoryName,
            slug: categorySlug,
            description: `Subcategory of ${parentCategory.name}, created via Excel upload on ${new Date().toLocaleDateString()}`,
            isActive: true
          }
        })
        console.log(`✅ Created nested category: ${category.name}`)
      }
      
    } else {
      // Fallback: Use category from CSV file
      let fallbackCategoryName = categoryName || 'General'
      
      category = await prisma.category.findFirst({
        where: { name: fallbackCategoryName }
      })

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: fallbackCategoryName,
            slug: fallbackCategoryName.toLowerCase().replace(/\s+/g, '-'),
            description: `Uploaded via Excel on ${new Date().toLocaleDateString()}`,
            isActive: true
          }
        })
        console.log(`✅ Created category: ${fallbackCategoryName}`)
      } else {
        console.log(`✅ Using existing category: ${fallbackCategoryName}`)
      }
    }

    // Create questions
    let questionsCreated = 0
    const subjectsCreated = new Set<string>()
    const createdQuestionIds: string[] = []

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
      const question = await prisma.question.create({
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

      createdQuestionIds.push(question.id)
      questionsCreated++
    }

    console.log(`✅ Created ${questionsCreated} questions in ${subjectsCreated.size} subjects`)

    // Create test if requested
    let testCreatedTitle = null
    if (createTest && testTitle && createdQuestionIds.length > 0) {
      const test = await prisma.test.create({
        data: {
          title: testTitle,
          description: `Auto-generated from Excel upload on ${new Date().toLocaleDateString()}`,
          duration: Math.ceil(createdQuestionIds.length * 0.75), // 45 seconds per question
          totalQuestions: createdQuestionIds.length,
          totalMarks: questionsCreated,
          passingMarks: Math.ceil(questionsCreated * 0.33),
          questionIds: createdQuestionIds,
          categoryId: category.id,
          isFree: true,
          isActive: true,
          testType: 'FULL_LENGTH'
        }
      })
      testCreatedTitle = test.title
      console.log(`✅ Created test: ${test.title}`)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${questionsCreated} questions to category "${categoryName}"!${testCreatedTitle ? ` Test "${testCreatedTitle}" created!` : ''}`,
      data: {
        questionsCreated,
        category: categoryName,
        subjectsCreated: subjectsCreated.size,
        testCreated: testCreatedTitle
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
