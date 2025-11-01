import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import pdf from 'pdf-parse';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  try {
    const formData = await req.formData();
    const command = formData.get('command') as string | null;
    const file = formData.get('file') as File | null;

    let result: any = {};

    // Handle command-based exam creation
    if (command) {
      console.log(`Processing command: ${command}`);
      result.examStructure = await handleExamCreationCommand(command);
    }

    // Handle file-based question uploading
    if (file) {
      console.log(`Processing file: ${file.name}`);
      result.questions = await handleQuestionUpload(file);
    }

    return NextResponse.json({ 
      success: true,
      message: 'AI processing completed successfully',
      data: result
    }, { status: 200 });

  } catch (error) {
    console.error('Error in AI admin route:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal Server Error'
    }, { status: 500 });
  }
}

async function handleExamCreationCommand(command: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `You are an expert exam creator for competitive exams in India. Based on the following command, create a comprehensive exam structure.

Command: "${command}"

Generate a detailed exam structure with the following JSON format:

{
  "examName": "Name of the exam (e.g., Delhi Police Constable 2024)",
  "category": "Category name (e.g., Police & Defence)",
  "description": "Brief description of the exam",
  "duration": 120,
  "totalQuestions": 100,
  "totalMarks": 100,
  "passingMarks": 40,
  "sections": [
    {
      "name": "Section name (e.g., General Knowledge)",
      "duration": 30,
      "questions": [
        {
          "questionText": "Question text here",
          "optionA": "First option",
          "optionB": "Second option",
          "optionC": "Third option",
          "optionD": "Fourth option",
          "correctOption": "A",
          "explanation": "Detailed explanation of why this answer is correct",
          "difficulty": "MEDIUM",
          "marks": 1,
          "negativeMarks": 0.25,
          "subject": "Subject name",
          "topic": "Topic name"
        }
      ]
    }
  ]
}

Important guidelines:
- Generate realistic questions based on the exam pattern
- Include proper explanations for each answer
- Ensure questions are relevant to the exam type
- Use appropriate difficulty levels
- Include negative marking where applicable
- Return ONLY valid JSON, no markdown formatting

Generate the complete exam structure now.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response (remove markdown code blocks if present)
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const examStructure = JSON.parse(cleanedText);
    
    // Save to database
    const savedExam = await saveExamToDatabase(examStructure);
    
    return {
      ...examStructure,
      databaseId: savedExam.id,
      message: 'Exam created and saved successfully'
    };
  } catch (error) {
    console.error('Error in exam creation:', error);
    throw new Error('Failed to create exam structure: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

async function handleQuestionUpload(file: File) {
  let fileContent = '';
  
  // Extract text based on file type
  if (file.type === 'application/pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdf(buffer);
    fileContent = data.text;
  } else {
    // Text files, markdown, JSON
    fileContent = await file.text();
  }

  console.log('Extracted file content length:', fileContent.length);

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `You are an expert at extracting and structuring exam questions from documents. 

Analyze the following content and extract all questions with their answers:

${fileContent}

Convert them into a structured JSON array with this exact format:

[
  {
    "questionText": "The complete question text",
    "optionA": "First option (if MCQ)",
    "optionB": "Second option (if MCQ)",
    "optionC": "Third option (if MCQ)",
    "optionD": "Fourth option (if MCQ)",
    "correctOption": "A" (or B, C, D for MCQ),
    "explanation": "Detailed explanation of the answer",
    "difficulty": "EASY" or "MEDIUM" or "HARD",
    "marks": 1,
    "negativeMarks": 0.25,
    "subject": "Subject name (infer from question)",
    "topic": "Topic name (infer from question)",
    "questionType": "MCQ" or "SUBJECTIVE" or "TRUE_FALSE"
  }
]

Guidelines:
- Extract ALL questions found in the document
- Infer subject and topic from the question content
- If options are not provided, set questionType to "SUBJECTIVE"
- Ensure explanations are clear and educational
- Assign appropriate difficulty levels
- Return ONLY valid JSON array, no markdown formatting

Extract and structure the questions now.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const questions = JSON.parse(cleanedText);
    
    // Save questions to database
    const savedQuestions = await saveQuestionsToDatabase(questions);
    
    return {
      extractedCount: questions.length,
      savedCount: savedQuestions.length,
      questions: savedQuestions,
      message: `Successfully extracted and saved ${savedQuestions.length} questions`
    };
  } catch (error) {
    console.error('Error in question upload:', error);
    throw new Error('Failed to extract questions: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

async function saveExamToDatabase(examStructure: any) {
  // First, find or create the category
  let category = await prisma.category.findFirst({
    where: { name: examStructure.category }
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: examStructure.category,
        slug: examStructure.category.toLowerCase().replace(/\s+/g, '-'),
        description: examStructure.description,
        isActive: true
      }
    });
  }

  // Create subjects and topics for questions
  const questionIds: string[] = [];
  
  for (const section of examStructure.sections) {
    for (const q of section.questions) {
      // Find or create subject
      let subject = await prisma.subject.findFirst({
        where: { 
          categoryId: category.id,
          name: q.subject 
        }
      });

      if (!subject) {
        subject = await prisma.subject.create({
          data: {
            categoryId: category.id,
            name: q.subject,
            slug: q.subject.toLowerCase().replace(/\s+/g, '-'),
            isActive: true
          }
        });
      }

      // Find or create topic
      let topic = await prisma.topic.findFirst({
        where: { 
          subjectId: subject.id,
          name: q.topic 
        }
      });

      if (!topic) {
        topic = await prisma.topic.create({
          data: {
            subjectId: subject.id,
            name: q.topic,
            slug: q.topic.toLowerCase().replace(/\s+/g, '-'),
            difficulty: q.difficulty || 'MEDIUM',
            isActive: true
          }
        });
      }

      // Create question
      const question = await prisma.question.create({
        data: {
          topicId: topic.id,
          questionType: 'MCQ',
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctOption,
          explanation: q.explanation,
          difficulty: q.difficulty || 'MEDIUM',
          marks: q.marks || 1,
          negativeMarks: q.negativeMarks || 0.25,
          isActive: true,
          isVerified: false,
          moderationStatus: 'PENDING'
        }
      });

      questionIds.push(question.id);
    }
  }

  // Create the test
  const test = await prisma.test.create({
    data: {
      categoryId: category.id,
      title: examStructure.examName,
      description: examStructure.description,
      testType: 'FULL_LENGTH',
      duration: examStructure.duration,
      totalQuestions: examStructure.totalQuestions,
      totalMarks: examStructure.totalMarks,
      passingMarks: examStructure.passingMarks,
      questionIds: questionIds,
      hasNegativeMarking: true,
      isActive: true,
      isFree: true
    }
  });

  return test;
}

async function saveQuestionsToDatabase(questions: any[]) {
  const savedQuestions = [];

  for (const q of questions) {
    try {
      // Find or create a default category for uploaded questions
      let category = await prisma.category.findFirst({
        where: { slug: 'general' }
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: 'General',
            slug: 'general',
            description: 'General questions from uploads',
            isActive: true
          }
        });
      }

      // Find or create subject
      let subject = await prisma.subject.findFirst({
        where: { 
          categoryId: category.id,
          name: q.subject || 'General'
        }
      });

      if (!subject) {
        subject = await prisma.subject.create({
          data: {
            categoryId: category.id,
            name: q.subject || 'General',
            slug: (q.subject || 'general').toLowerCase().replace(/\s+/g, '-'),
            isActive: true
          }
        });
      }

      // Find or create topic
      let topic = await prisma.topic.findFirst({
        where: { 
          subjectId: subject.id,
          name: q.topic || 'General'
        }
      });

      if (!topic) {
        topic = await prisma.topic.create({
          data: {
            subjectId: subject.id,
            name: q.topic || 'General',
            slug: (q.topic || 'general').toLowerCase().replace(/\s+/g, '-'),
            difficulty: q.difficulty || 'MEDIUM',
            isActive: true
          }
        });
      }

      // Create question
      const question = await prisma.question.create({
        data: {
          topicId: topic.id,
          questionType: q.questionType || 'MCQ',
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctOption,
          explanation: q.explanation,
          difficulty: q.difficulty || 'MEDIUM',
          marks: q.marks || 1,
          negativeMarks: q.negativeMarks || 0.25,
          isActive: true,
          isVerified: false,
          moderationStatus: 'PENDING'
        }
      });

      savedQuestions.push(question);
    } catch (error) {
      console.error('Error saving question:', error);
      // Continue with next question
    }
  }

  return savedQuestions;
}
