import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { parseExamContent, convertToDBFormat } from '@/lib/question-parser';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 403 });
  }

  try {
    const formData = await req.formData();
    const command = formData.get('command') as string | null;
    const file = formData.get('file') as File | null;

    console.log('=== AI Admin Request ===');
    console.log('Command:', command);
    console.log('File:', file ? `${file.name} (${file.size} bytes, ${file.type})` : 'None');

    if (!command && !file) {
      return NextResponse.json({ 
        success: false,
        error: 'Please provide either a command or upload a file'
      }, { status: 400 });
    }

    let result: any = {};
    const confirmed = formData.get('confirmed') === 'true';

    // Handle command-based operations
    if (command) {
      console.log(`Processing command: ${command}`);
      try {
        // Detect command type
        const lowerCommand = command.toLowerCase();
        
        if (lowerCommand.includes('create category') || lowerCommand.includes('add category')) {
          result.categoryAction = await handleCategoryCommand(command, 'create', confirmed);
        } else if (lowerCommand.includes('delete category') || lowerCommand.includes('remove category')) {
          result.categoryAction = await handleCategoryCommand(command, 'delete', confirmed);
        } else if (lowerCommand.includes('under') && (lowerCommand.includes('create') || lowerCommand.includes('subcategory'))) {
          result.categoryAction = await handleCategoryCommand(command, 'nested', confirmed);
        } else {
          // Regular exam creation
          result.examStructure = await handleExamCreationCommand(command);
        }
        console.log('✅ Command processing successful');
      } catch (error) {
        console.error('❌ Command processing failed:', error);
        throw error;
      }
    }

    // Handle file-based question uploading
    if (file) {
      console.log(`Processing file: ${file.name}`);
      try {
        result.questions = await handleQuestionUpload(file, confirmed);
        console.log('✅ File processing successful');
      } catch (error) {
        console.error('❌ File processing failed:', error);
        throw error;
      }
    }

    console.log('=== AI Admin Success ===');
    return NextResponse.json({ 
      success: true,
      message: 'AI processing completed successfully',
      data: result
    }, { status: 200 });

  } catch (error) {
    console.error('=== AI Admin Error ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal Server Error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

async function handleCategoryCommand(command: string, action: 'create' | 'delete' | 'nested', confirmed: boolean) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  // Extract category information using AI
  const extractionPrompt = `Extract category information from this command: "${command}"

Action: ${action}

Return ONLY a JSON object with:
- name: The category name
- description: Brief description (for create/nested actions)
- parentCategory: Parent category name (for nested action only)
- slug: URL-friendly slug

Example responses:
{"name": "UPSC Civil Services", "description": "Union Public Service Commission Civil Services Examination", "slug": "upsc-civil-services"}
{"name": "Prelims", "description": "UPSC Preliminary Examination", "parentCategory": "UPSC Civil Services", "slug": "prelims"}
{"name": "Old Exams", "slug": "old-exams"}`;

  const result = await model.generateContent(extractionPrompt);
  const responseText = result.response.text();
  
  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to extract category information');
  
  const categoryInfo = JSON.parse(jsonMatch[0]);

  // Request confirmation if not already confirmed
  if (!confirmed) {
    return {
      requiresConfirmation: true,
      confirmationType: 'category',
      action: `${action.charAt(0).toUpperCase() + action.slice(1)} category`,
      details: categoryInfo
    };
  }

  // Execute the action
  if (action === 'create') {
    const category = await prisma.category.create({
      data: {
        name: categoryInfo.name,
        slug: categoryInfo.slug || categoryInfo.name.toLowerCase().replace(/\s+/g, '-'),
        description: categoryInfo.description || null,
      }
    });
    return { type: 'created', name: category.name, description: category.description };
  }

  if (action === 'delete') {
    const category = await prisma.category.findFirst({
      where: { name: { contains: categoryInfo.name, mode: 'insensitive' } }
    });
    
    if (!category) throw new Error(`Category "${categoryInfo.name}" not found`);
    
    // Check if category has tests
    const testCount = await prisma.test.count({
      where: { categoryId: category.id }
    });
    
    if (testCount > 0) {
      throw new Error(`Cannot delete category "${categoryInfo.name}" because it contains ${testCount} tests`);
    }
    
    await prisma.category.delete({ where: { id: category.id } });
    return { type: 'deleted', name: category.name };
  }

  if (action === 'nested') {
    // For nested categories, we can use the description field or create a separate parent-child relationship
    // For simplicity, we'll create the child category with a parent reference in the name
    const parentCategory = await prisma.category.findFirst({
      where: { name: { contains: categoryInfo.parentCategory, mode: 'insensitive' } }
    });
    
    if (!parentCategory) throw new Error(`Parent category "${categoryInfo.parentCategory}" not found`);
    
    const childCategory = await prisma.category.create({
      data: {
        name: `${parentCategory.name} - ${categoryInfo.name}`,
        slug: `${parentCategory.slug}-${categoryInfo.slug}`,
        description: categoryInfo.description || `${categoryInfo.name} under ${parentCategory.name}`,
      }
    });
    
    return { 
      type: 'nested', 
      parent: parentCategory.name, 
      child: childCategory.name 
    };
  }

  throw new Error('Invalid action');
}

async function handleExamCreationCommand(command: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `You are an elite exam architect with 15+ years of experience creating competitive exams for Indian government recruitment (SSC, UPSC, Railway, Banking, Police, Defence, Teaching jobs). You understand exam patterns, difficulty progression, and authentic question styles.

## YOUR MISSION:
Based on this command: "${command}"

Create a complete, professional-grade competitive exam that matches the EXACT pattern and difficulty of real Indian government exams.

## CATEGORY INTELLIGENCE:
Automatically determine the BEST category for this exam from these common categories:
- **SSC & Railway** - SSC CGL, CHSL, MTS, RRB exams
- **Banking & Finance** - IBPS, SBI, RBI exams
- **Police & Defence** - Delhi Police, CRPF, Army, Navy, Air Force
- **Teaching & Education** - CTET, KVS, DSSSB, NVS, TET
- **State PSC** - UPPSC, BPSC, MPPSC, RPSC, UKPSC
- **Engineering & Technical** - GATE, PSUs, Technical posts
- **Medical & Healthcare** - NEET, AIIMS, Nursing exams
- **Legal & Judicial** - CLAT, Judiciary, Law exams

If the exam doesn't fit any above, CREATE A NEW CATEGORY with a professional name.
Examples: "MPPSC & State Services", "Delhi Police Recruitment", "KVS Teaching Posts"

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
  "category": "Exact category name (use existing or create new professional name)",
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
✓ Escape all special characters in strings (quotes, newlines, backslashes)
✓ Use \\n for line breaks within text, not actual newlines
✓ Do not use smart quotes (" ") or apostrophes ('), use straight quotes only
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
    
    console.log('========== EXAM CREATION AI RESPONSE ==========');
    console.log('Raw response length:', text.length);
    console.log('First 1000 chars:', text.substring(0, 1000));
    console.log('Last 500 chars:', text.substring(text.length - 500));
    console.log('=============================================');
    
    // Extract JSON from the response (remove markdown code blocks if present)
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find the JSON object by looking for the outermost braces
    const startIndex = cleanedText.indexOf('{');
    const endIndex = cleanedText.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1) {
      console.error('No JSON object brackets found!');
      throw new Error(`No valid JSON object found in response. Starts with: ${cleanedText.substring(0, 200)}...`);
    }
    
    cleanedText = cleanedText.substring(startIndex, endIndex + 1);
    
    console.log('Extracted JSON object (first 500 chars):', cleanedText.substring(0, 500));
    
    let examStructure;
    try {
      // Try parsing directly first
      examStructure = JSON.parse(cleanedText);
      console.log('✅ Successfully parsed exam JSON on first attempt!');
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('Problematic JSON (first 1000 chars):', cleanedText.substring(0, 1000));
      
      // Try minimal cleaning - just remove trailing commas
      try {
        let fixedText = cleanedText.replace(/,(\s*[}\]])/g, '$1');
        examStructure = JSON.parse(fixedText);
        console.log('✅ Successfully parsed after removing trailing commas!');
      } catch (secondError) {
        console.error('❌ Still failed after cleaning:', secondError);
        const errorMsg = secondError instanceof Error ? secondError.message : 'Unknown error';
        throw new Error(`Failed to parse exam JSON. Error: ${errorMsg}`);
      }
    }
    
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

async function handleQuestionUpload(file: File, confirmed: boolean = false) {
  let fileContent = '';
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  console.log('Processing file:', file.name, 'Type:', file.type, 'Extension:', fileExtension);
  
  // Extract text based on file type
  if (file.type === 'application/pdf' || fileExtension === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Dynamic import for pdf-parse
    const pdfParse = await import('pdf-parse');
    const data = await (pdfParse as any)(buffer);
    fileContent = data.text;
  } else if (
    fileExtension === 'md' || 
    fileExtension === 'markdown' || 
    fileExtension === 'txt' || 
    fileExtension === 'json' ||
    file.type.includes('text') ||
    file.type.includes('markdown')
  ) {
    // Text files, markdown, JSON
    fileContent = await file.text();
  } else {
    throw new Error(`Unsupported file type: ${file.type}. Please upload PDF, TXT, MD, or JSON files.`);
  }

  console.log('Extracted file content length:', fileContent.length);

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `You are a master question extractor and competitive exam content specialist. You have processed 10,000+ exam papers and can extract, structure, and enhance questions from any format.

## YOUR MISSION:
Extract ALL questions from this document and convert them into a perfectly structured database-ready format.

## DOCUMENT CONTENT:
${fileContent.substring(0, 15000)} ${fileContent.length > 15000 ? '...(content truncated)' : ''}

## INTELLIGENT CATEGORIZATION:
Analyze the document and questions to determine the BEST category. Use existing categories or create new ones:

**Existing Categories:**
- SSC & Railway
- Banking & Finance  
- Police & Defence
- Teaching & Education
- State PSC
- Engineering & Technical
- Medical & Healthcare
- Legal & Judicial

**Create New Category If Needed:**
If questions are for MPPSC, UPPSC, specific state exams, or other unique exams, create a professional category name like:
- "MPPSC & State Services"
- "Delhi Police Recruitment"
- "KVS Teaching Posts"
- "Railway Technical Posts"

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
    "questionType": "MCQ|SUBJECTIVE|TRUE_FALSE",
    "category": "Intelligent category name based on document analysis"
  }
]

## CRITICAL RULES:
✓ Extract EVERY question found (don't skip any)
✓ Clean text: remove extra spaces, line breaks, formatting artifacts
✓ Use \\n for line breaks within strings (not actual newlines)
✓ Do not use smart quotes (" ") or apostrophes ('), use straight quotes only
✓ Escape all backslashes as \\\\
✓ No trailing commas in JSON objects or arrays
✓ If answer is unclear, make best educated guess based on context
✓ Generate explanations for questions without them
✓ Return ONLY valid JSON array (no markdown code blocks, no text, no explanations)
✓ The response must start with [ and end with ]
✓ Maintain question numbering order from document
✓ Handle incomplete questions gracefully (use available information)
✓ For subjective questions, set optionA-D to null and correctOption to null
✓ Add "category" field to each question based on document analysis

## RESPONSE FORMAT:
Your ENTIRE response must be ONLY the JSON array. Nothing before it, nothing after it.
Start your response with: [
End your response with: ]
No markdown, no code blocks, no explanations.

## QUALITY CHECKS:
- Each question must have questionText
- MCQ must have all 4 options and correctOption
- Subject and topic must be meaningful (not "General" unless truly general)
- Difficulty must reflect actual complexity
- Explanation must be helpful and accurate
- Category should be professionally named and consistent

Extract and structure ALL questions NOW:`;

  try {
    console.log('🔍 Sending content to AI for extraction...');
    console.log('Content length:', fileContent.length);
    console.log('Content preview:', fileContent.substring(0, 300));
    
    const result = await model.generateContent([
      { text: prompt },
      { text: '\n\n**CRITICAL**: Your response MUST be ONLY a valid JSON array starting with [ and ending with ]. No explanations, no markdown, no text before or after. Just pure JSON array.' }
    ]);
    const response = await result.response;
    const text = response.text();
    
    console.log('========== AI RESPONSE DEBUG ==========');
    console.log('Raw response length:', text.length);
    console.log('First 1000 chars:', text.substring(0, 1000));
    console.log('Last 500 chars:', text.substring(text.length - 500));
    console.log('=====================================');
    
    // Extract JSON from the response - try multiple patterns
    let cleanedText = text.trim();
    
    // Remove markdown code blocks
    cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Remove any leading/trailing text before/after JSON
    const startIndex = cleanedText.indexOf('[');
    const endIndex = cleanedText.lastIndexOf(']');
    
    if (startIndex === -1 || endIndex === -1) {
      console.error('No JSON array brackets found!');
      console.error('Full cleaned text:', cleanedText);
      throw new Error(`No valid JSON array found in response. Response starts with: ${cleanedText.substring(0, 200)}...`);
    }
    
    cleanedText = cleanedText.substring(startIndex, endIndex + 1);
    
    console.log('Extracted JSON (first 500 chars):', cleanedText.substring(0, 500));
    console.log('Extracted JSON (last 200 chars):', cleanedText.substring(cleanedText.length - 200));
    
    let questions;
    try {
      // Try parsing directly first - AI usually returns valid JSON
      questions = JSON.parse(cleanedText);
      console.log('✅ Successfully parsed JSON on first attempt!');
      console.log(`Extracted ${questions.length} questions`);
    } catch (parseError) {
      console.error('❌ JSON parse error on first attempt:', parseError);
      console.error('Error message:', parseError instanceof Error ? parseError.message : 'Unknown');
      console.error('Problematic character around position:', parseError instanceof Error && parseError.message.includes('position') ? parseError.message : 'Unknown position');
      
      // Check if the issue is escaped backslashes in the response
      // Sometimes AI returns: \"BENEVOLENT\" instead of "BENEVOLENT"
      if (cleanedText.includes('\\"')) {
        console.log('⚠️ Detected escaped quotes - the AI over-escaped the JSON');
        try {
          // Remove the extra escaping
          let fixedText = cleanedText.replace(/\\"/g, '"');
          questions = JSON.parse(fixedText);
          console.log('✅ Successfully parsed after fixing escaped quotes!');
        } catch (fixError) {
          console.error('❌ Still failed after fixing quotes');
          // Continue to next fallback
        }
      }
      
      // If still not parsed, try removing trailing commas
      if (!questions) {
        try {
          let fixedText = cleanedText.replace(/,(\s*[}\]])/g, '$1');
          questions = JSON.parse(fixedText);
          console.log('✅ Successfully parsed after removing trailing commas!');
        } catch (secondError) {
          console.error('❌ Still failed after minimal cleaning:', secondError);
          console.error('This usually means the AI returned malformed JSON');
          console.error('First 2000 chars of attempted JSON:', cleanedText.substring(0, 2000));
          
          // FALLBACK: Try smart pattern-based parser
          console.log('🔄 Attempting fallback: Smart pattern-based parser...');
          try {
            const parsedQuestions = parseExamContent(fileContent);
            if (parsedQuestions.length > 0) {
              console.log(`✅ Smart parser extracted ${parsedQuestions.length} questions!`);
              questions = convertToDBFormat(parsedQuestions, 'General');
            } else {
              throw new Error('Smart parser found no questions');
            }
          } catch (parserError) {
            console.error('❌ Smart parser also failed:', parserError);
            
            // Provide helpful error message
            const errorMsg = secondError instanceof Error ? secondError.message : 'Unknown error';
            throw new Error(
              `Failed to extract questions using both AI and pattern matching.\n` +
              `AI Parse Error: ${errorMsg}\n` +
              `Pattern Parser: ${parserError instanceof Error ? parserError.message : 'Failed'}\n` +
              `Your file might be in an unsupported format. Please ensure questions are numbered (1., 2., etc.) with options (a), (b), (c), (d) and include an ANSWER KEY section.`
            );
          }
        }
      }
    }
    
    // Extract category information for confirmation
    const categoryName = questions[0]?.category || 'General';
    const questionCount = questions.length;
    
    // Request confirmation if not already confirmed
    if (!confirmed) {
      return {
        requiresConfirmation: true,
        confirmationType: 'questions',
        action: `Upload ${questionCount} questions to category`,
        details: {
          category: categoryName,
          questionCount,
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(2)} KB`
        }
      };
    }
    
    // Save questions to database
    const savedQuestions = await saveQuestionsToDatabase(questions);
    
    return {
      extractedCount: questions.length,
      savedCount: savedQuestions.length,
      categoryName,
      questions: savedQuestions,
      message: `Successfully extracted and saved ${savedQuestions.length} questions to ${categoryName}`
    };
  } catch (error) {
    console.error('❌ Error in question upload (main catch):', error);
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    
    // Try smart parser as last resort
    console.log('🔄 Attempting smart pattern-based parser as final fallback...');
    try {
      const parsedQuestions = parseExamContent(fileContent);
      if (parsedQuestions.length > 0) {
        console.log(`✅ Smart parser successfully extracted ${parsedQuestions.length} questions!`);
        const questions = convertToDBFormat(parsedQuestions, 'General');
        
        // Request confirmation if not confirmed
        if (!confirmed) {
          return {
            requiresConfirmation: true,
            confirmationType: 'questions',
            action: `Upload ${questions.length} questions to category`,
            details: {
              category: 'General',
              questionCount: questions.length,
              fileName: file.name,
              fileSize: `${(file.size / 1024).toFixed(2)} KB`,
              note: 'Extracted using pattern matching (AI failed)'
            }
          };
        }
        
        // Save questions
        const savedQuestions = await saveQuestionsToDatabase(questions);
        return {
          extractedCount: questions.length,
          savedCount: savedQuestions.length,
          categoryName: 'General',
          questions: savedQuestions,
          message: `Successfully extracted and saved ${savedQuestions.length} questions using pattern matching`
        };
      }
    } catch (parserError) {
      console.error('❌ Smart parser also failed:', parserError);
    }
    
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
      // Use category from question or default to "General"
      const categoryName = q.category || 'General';
      
      // Find or create category
      let category = await prisma.category.findFirst({
        where: { name: categoryName }
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: categoryName,
            slug: categoryName.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
            description: `Questions for ${categoryName} exams`,
            isActive: true
          }
        });
        console.log(`Created new category: ${categoryName}`);
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
