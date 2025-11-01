import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY not configured - AI features will be disabled')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-dummy',
})

interface ChatOptions {
  message: string
  conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  ragContext?: string
  questionId?: string
}

export async function generateChatResponse(options: ChatOptions) {
  const { message, conversationHistory, ragContext, questionId } = options

  const systemPrompt = `You are an expert AI tutor helping students prepare for competitive exams. 
Your role is to:
- Explain concepts clearly and step-by-step
- Provide hints without giving away complete answers
- Reference relevant formulas and theories
- Encourage critical thinking
- Be patient and supportive

${ragContext ? `\n\nRelevant context from our solution database:\n${ragContext}` : ''}
${questionId ? `\n\nThis conversation is about a specific question. Help the student understand the concept without directly revealing the answer.` : ''}`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...conversationHistory,
    { role: 'user' as const, content: message },
  ]

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages,
    temperature: 0.7,
    max_tokens: 1000,
  })

  const response = completion.choices[0].message.content || ''
  
  return {
    content: response,
    model: completion.model,
    tokens: completion.usage?.total_tokens || 0,
    sources: ragContext ? [{ type: 'solution_database', content: ragContext.slice(0, 200) }] : [],
    confidence: 0.85, // TODO: Implement actual confidence scoring
  }
}

// Generate hints for a question
export async function generateHints(questionText: string, difficulty: string) {
  const prompt = `Generate 3 progressive hints for this ${difficulty} difficulty question:

Question: ${questionText}

Generate hints in this format:
Hint 1 (Subtle): [A subtle nudge in the right direction]
Hint 2 (Moderate): [More specific guidance]
Hint 3 (Detailed): [Detailed hint but still not the complete answer]

Respond in JSON format:
{
  "hints": [
    { "level": 1, "text": "..." },
    { "level": 2, "text": "..." },
    { "level": 3, "text": "..." }
  ]
}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    response_format: { type: 'json_object' },
  })

  const response = JSON.parse(completion.choices[0].message.content || '{"hints": []}')
  return response.hints
}

// Generate questions from a prompt
export async function generateQuestions(prompt: string, count: number = 5) {
  const systemPrompt = `You are an AI question generator for competitive exams. Generate high-quality, exam-standard questions.

Requirements:
- Questions must be clear and unambiguous
- Include 4 options (A, B, C, D) for MCQ
- Provide detailed explanations
- Tag difficulty level (EASY, MEDIUM, HARD)
- Include relevant topics/tags

Return a JSON array of questions with this structure:
{
  "questions": [
    {
      "questionText": "...",
      "questionType": "MCQ",
      "optionA": "...",
      "optionB": "...",
      "optionC": "...",
      "optionD": "...",
      "correctOption": "A",
      "explanation": "...",
      "difficulty": "MEDIUM",
      "tags": ["tag1", "tag2"]
    }
  ]
}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate ${count} questions based on: ${prompt}` },
    ],
    temperature: 0.9,
    response_format: { type: 'json_object' },
  })

  const response = JSON.parse(completion.choices[0].message.content || '{"questions": []}')
  return response.questions
}

// Tag difficulty automatically
export async function tagDifficulty(questionText: string, options: string[]) {
  const prompt = `Analyze this question and determine its difficulty level for competitive exam students.

Question: ${questionText}
Options: ${options.join(', ')}

Consider:
- Conceptual complexity
- Calculation steps required
- Common mistakes possible
- Time to solve

Respond with JSON:
{
  "difficulty": "EASY|MEDIUM|HARD",
  "reasoning": "Why this difficulty level",
  "estimatedTime": 60
}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })

  const response = JSON.parse(completion.choices[0].message.content || '{"difficulty": "MEDIUM"}')
  return response
}

// Evaluate subjective answers
export async function evaluateSubjectiveAnswer(
  questionText: string,
  correctAnswer: string,
  userAnswer: string,
  maxScore: number
) {
  const prompt = `Evaluate this student's answer to a subjective question.

Question: ${questionText}

Model Answer: ${correctAnswer}

Student's Answer: ${userAnswer}

Maximum Score: ${maxScore}

Provide detailed evaluation with:
1. Score out of ${maxScore}
2. Rubric-based breakdown (understanding, explanation, examples, accuracy)
3. Specific feedback on what's good and what's missing
4. Suggestions for improvement

Respond in JSON:
{
  "score": 7.5,
  "rubric": {
    "understanding": 2.5,
    "explanation": 2,
    "examples": 1.5,
    "accuracy": 1.5
  },
  "feedback": "...",
  "suggestions": "..."
}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })

  const response = JSON.parse(completion.choices[0].message.content || '{"score": 0}')
  return response
}
