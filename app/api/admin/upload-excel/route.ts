import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Papa from 'papaparse'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    
    // Parse CSV using Papa Parse
    const parseResult = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim()
    })

    if (parseResult.errors.length > 0) {
      console.error('❌ CSV parsing errors:', parseResult.errors)
      return NextResponse.json({
        success: false,
        message: `CSV parsing error: ${parseResult.errors[0].message}. Please ensure your file is properly formatted.`
      }, { status: 400 })
    }

    const rows = parseResult.data as any[]
    
    if (rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'File is empty or has no data rows. Please use the template.' 
      })
    }

    const questions: any[] = []
    let categoryName = ''
    const subjectsSet = new Set<string>()

    console.log(`Processing ${rows.length} rows...`)

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      // Extract fields (try different possible header variations)
      const questionText = row['Question Text'] || row['question_text'] || row['QuestionText'] || ''
      const optionA = row['Option A'] || row['option_a'] || row['OptionA'] || ''
      const optionB = row['Option B'] || row['option_b'] || row['OptionB'] || ''
      const optionC = row['Option C'] || row['option_c'] || row['OptionC'] || ''
      const optionD = row['Option D'] || row['option_d'] || row['OptionD'] || ''
      const correctAnswer = row['Correct Answer (A/B/C/D)'] || row['Correct Answer'] || row['correct_answer'] || row['CorrectAnswer'] || ''
      const explanation = row['Explanation'] || row['explanation'] || ''
      const subject = row['Subject'] || row['subject'] || 'General Knowledge'
      const topic = row['Topic'] || row['topic'] || ''
      const category = row['Category'] || row['category'] || ''
      const marks = row['Marks'] || row['marks'] || '1'
      const difficulty = row['Difficulty (EASY/MEDIUM/HARD)'] || row['Difficulty'] || row['difficulty'] || 'MEDIUM'

      // Validate required fields
      if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
        console.log(`⚠️ Row ${i + 2} skipped: missing required fields`)
        continue
      }

      // Validate correct answer
      const answer = correctAnswer.toString().trim().toUpperCase()
      if (!['A', 'B', 'C', 'D'].includes(answer)) {
        console.log(`⚠️ Row ${i + 2} skipped: invalid answer "${correctAnswer}" (must be A, B, C, or D)`)
        continue
      }

      categoryName = category?.toString().trim() || categoryName || 'General'
      const subjectName = subject?.toString().trim() || 'General Knowledge'
      if (subjectName) subjectsSet.add(subjectName)

      const difficultyValue = (difficulty?.toString().trim().toUpperCase() || 'MEDIUM')
      const validDifficulty = ['EASY', 'MEDIUM', 'HARD'].includes(difficultyValue) 
        ? difficultyValue 
        : 'MEDIUM'

      questions.push({
        questionText: questionText.toString().trim(),
        optionA: optionA.toString().trim(),
        optionB: optionB.toString().trim(),
        optionC: optionC.toString().trim(),
        optionD: optionD.toString().trim(),
        correctAnswer: answer,
        explanation: explanation?.toString().trim() || `The correct answer is option ${answer}.`,
        subject: subjectName,
        topic: topic?.toString().trim() || '',
        marks: parseInt(marks.toString()) || 1,
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

    // Find or create a default course for Excel uploads
    let defaultCourse = await prisma.course.findFirst({
      where: { slug: 'excel-uploads' }
    })

    if (!defaultCourse) {
      defaultCourse = await prisma.course.create({
        data: {
          title: 'Excel Uploads',
          slug: 'excel-uploads',
          description: 'Questions uploaded via Excel/CSV files',
          isActive: true,
          isFree: true,
          order: 994
        }
      })
      console.log(`✅ Created default course for Excel uploads`)
    }

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
      
      // Check if category already exists in this course
      const existingCategory = await prisma.category.findFirst({
        where: { 
          slug: categorySlug,
          courseId: defaultCourse.id
        }
      })
      
      if (existingCategory) {
        return NextResponse.json({
          success: false,
          message: `Category "${newCategoryName}" already exists in this course. Please use a different name or select the existing category.`
        }, { status: 400 })
      }
      
      category = await prisma.category.create({
        data: {
          name: newCategoryName,
          slug: categorySlug,
          description: newCategoryDescription || `Created via Excel upload on ${new Date().toLocaleDateString()}`,
          isActive: true,
          courseId: defaultCourse.id
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
      
      // Check if nested category already exists in the same course as parent
      const existingCategory = await prisma.category.findFirst({
        where: { 
          slug: categorySlug,
          courseId: parentCategory.courseId
        }
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
            isActive: true,
            courseId: parentCategory.courseId
          }
        })
        console.log(`✅ Created nested category: ${category.name}`)
      }
      
    } else {
      // Fallback: Use category from CSV file
      let fallbackCategoryName = categoryName || 'General'
      
      category = await prisma.category.findFirst({
        where: { 
          name: fallbackCategoryName,
          courseId: defaultCourse.id
        }
      })

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: fallbackCategoryName,
            slug: fallbackCategoryName.toLowerCase().replace(/\s+/g, '-'),
            description: `Uploaded via Excel on ${new Date().toLocaleDateString()}`,
            isActive: true,
            courseId: defaultCourse.id
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
