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

  const prompt = `You are an elite exam architect with 15+ years of experience creating competitive exams for Indian government recruitment (SSC, UPSC, Railway, Banking, Police, Defence, Teaching jobs). You understand exam patterns, difficulty progression, and authentic question styles.

## YOUR MISSION:
Based on this command: "${command}"

Create a complete, professional-grade competitive exam that matches the EXACT pattern and difficulty of real Indian government exams.

## CRITICAL REQUIREMENTS:

### 1. EXAM PATTERN EXPERTISE
- **SSC CGL/CHSL**: 4 sections (English, Reasoning, Math, GK), 100 questions, 60-120 mins
- **Banking (IBPS/SBI)**: 5 sections (English, Reasoning, Quant, Computer, GK), 100 questions, 60 mins
- **Railway (RRB)**: Math, Reasoning, GK, Current Affairs, 100 questions, 90 mins
- **Police/Defence**: Physical standards, Reasoning, GK, Math, 100 questions, 90-120 mins
- **Teaching (CTET/KVS/DSSSB)**: Child Development, Language, Math, EVS/Science/Social, 150 questions, 150 mins
- **State PSC**: Varies by state, typically 150-200 questions, 180 mins

### 2. QUESTION QUALITY STANDARDS
- **EASY (30%)**: Direct recall, basic concepts, standard formulas
- **MEDIUM (50%)**: Application-based, 2-step reasoning, pattern recognition
- **HARD (20%)**: Multi-step analysis, advanced concepts, tricky options

### 3. AUTHENTIC QUESTION CHARACTERISTICS
- Use REAL exam language and phrasing
- Include current affairs from last 6 months (if applicable)
- Add numerical values, dates, names that feel authentic
- Create distractors (wrong options) that are plausible but clearly incorrect
- Mix theoretical and practical questions

### 4. EXPLANATION EXCELLENCE
Each explanation must include:
- Why the correct answer is right
- Why other options are wrong (if relevant)
- Key concept/formula/fact used
- Memory tip or shortcut (where applicable)

### 5. SUBJECT/TOPIC ACCURACY
Assign precise subjects and topics:
- General Knowledge → Indian History, Geography, Polity, Economy, Science
- Reasoning → Logical, Verbal, Non-Verbal, Analytical
- Mathematics → Arithmetic, Algebra, Geometry, Data Interpretation
- English → Grammar, Vocabulary, Comprehension, Sentence Correction

## OUTPUT FORMAT (STRICT JSON):

{
  "examName": "Full official exam name with year",
  "category": "Exact category (e.g., 'SSC & Railway', 'Banking & Finance', 'Police & Defence', 'Teaching & Education')",
  "description": "2-3 sentence professional description including eligibility and exam purpose",
  "duration": <total_minutes>,
  "totalQuestions": <count>,
  "totalMarks": <usually same as questions>,
  "passingMarks": <typically 40% of total for general category>,
  "sections": [
    {
      "name": "Section Name",
      "duration": <minutes_for_this_section>,
      "questions": [
        {
          "questionText": "Complete question with all context",
          "optionA": "Plausible option A",
          "optionB": "Plausible option B",
          "optionC": "Plausible option C",
          "optionD": "Plausible option D",
          "correctOption": "A",
          "explanation": "Comprehensive 3-4 line explanation with concept + why correct + why others wrong",
          "difficulty": "EASY|MEDIUM|HARD",
          "marks": 1,
          "negativeMarks": 0.25,
          "subject": "Specific subject name",
          "topic": "Precise topic name"
        }
      ]
    }
  ]
}

## CRITICAL RULES:
✓ Return ONLY valid JSON (no markdown, no code blocks, no extra text)
✓ Generate ALL questions (don't skip or summarize)
✓ Use authentic Indian exam language and references
✓ Ensure variety in topics within each section
✓ Balance difficulty: 30% easy, 50% medium, 20% hard
✓ Make every question exam-ready (can be used as-is)

Generate the complete exam structure NOW:`;

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

  const prompt = `You are a master question extractor and competitive exam content specialist. You have processed 10,000+ exam papers and can extract, structure, and enhance questions from any format.

## YOUR MISSION:
Extract ALL questions from this document and convert them into a perfectly structured database-ready format.

## DOCUMENT CONTENT:
${fileContent.substring(0, 15000)} ${fileContent.length > 15000 ? '...(content truncated)' : ''}

## EXTRACTION INTELLIGENCE:

### 1. QUESTION DETECTION
Identify questions by these patterns:
- Numbered items (1., Q1, Question 1, etc.)
- Question marks (?)
- Instruction phrases ("Choose the correct", "Select", "Find", "Calculate")
- MCQ patterns (A), B), C), D) or (a), (b), (c), (d)
- True/False statements
- Fill in the blanks with options

### 2. OPTION PARSING
Extract options intelligently:
- Handle formats: A), (A), a., A., [A], Option A:
- Detect when options are on same line vs separate lines
- Identify answer keys: "Answer: A", "Ans: A", "Correct: A", "(A)"
- Handle missing options (convert to SUBJECTIVE type)

### 3. ANSWER EXTRACTION
Find answers from:
- Answer keys at end of document
- Marked correct options (✓, *, bold)
- "Answer:" or "Ans:" labels
- Answer sheets in different sections
- Explanations that reveal the answer

### 4. SUBJECT & TOPIC INFERENCE
Intelligently categorize based on:
- Document title/header
- Question keywords and domain
- Common exam patterns
- Content analysis

**Subject Classification:**
- Math keywords: calculate, solve, equation, number, percentage, average
- English: grammar, sentence, vocabulary, comprehension, passage
- Reasoning: logical, series, pattern, analogy, coding-decoding
- General Knowledge: history, geography, politics, current affairs, science
- Computer: programming, software, hardware, internet, database

**Topic Precision:**
- Math → Arithmetic, Algebra, Geometry, Trigonometry, Statistics
- English → Grammar, Vocabulary, Comprehension, Idioms, Sentence Formation
- Reasoning → Logical Reasoning, Verbal Reasoning, Analytical Reasoning
- GK → Indian History, World History, Geography, Polity, Economy, Science, Current Affairs

### 5. EXPLANATION GENERATION
If explanation is missing, generate a concise one:
- State the correct answer clearly
- Briefly explain why it's correct
- Mention the concept/rule/fact used
- Keep it 2-3 lines maximum

### 6. DIFFICULTY ASSESSMENT
Assign difficulty based on:
- **EASY**: Direct recall, basic calculation, simple grammar
- **MEDIUM**: Application of concepts, 2-step reasoning, moderate complexity
- **HARD**: Complex analysis, multi-step solution, advanced concepts

## OUTPUT FORMAT (STRICT JSON ARRAY):

[
  {
    "questionText": "Complete question text (cleaned and formatted)",
    "optionA": "Option A text (null if not MCQ)",
    "optionB": "Option B text (null if not MCQ)",
    "optionC": "Option C text (null if not MCQ)",
    "optionD": "Option D text (null if not MCQ)",
    "correctOption": "A (or B/C/D for MCQ, null for subjective)",
    "explanation": "Clear explanation with reasoning (generate if missing)",
    "difficulty": "EASY|MEDIUM|HARD",
    "marks": 1,
    "negativeMarks": 0.25,
    "subject": "Specific subject name (e.g., 'General Knowledge', 'Mathematics')",
    "topic": "Precise topic (e.g., 'Indian History', 'Algebra', 'Grammar')",
    "questionType": "MCQ|SUBJECTIVE|TRUE_FALSE"
  }
]

## CRITICAL RULES:
✓ Extract EVERY question found (don't skip any)
✓ Clean text: remove extra spaces, line breaks, formatting artifacts
✓ If answer is unclear, make best educated guess based on context
✓ Generate explanations for questions without them
✓ Return ONLY valid JSON array (no markdown, no text, no code blocks)
✓ Maintain question numbering order from document
✓ Handle incomplete questions gracefully (use available information)
✓ For subjective questions, set optionA-D to null and correctOption to null

## QUALITY CHECKS:
- Each question must have questionText
- MCQ must have all 4 options and correctOption
- Subject and topic must be meaningful (not "General" unless truly general)
- Difficulty must reflect actual complexity
- Explanation must be helpful and accurate

Extract and structure ALL questions NOW:`;

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
