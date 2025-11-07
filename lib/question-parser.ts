/**
 * Smart Question Parser
 * Pre-processes exam content before sending to AI
 * Handles answer keys, sections, and large content
 */

export interface ParsedQuestion {
  questionNumber: number;
  questionText: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctOption: string | null;
  section?: string;
  subject?: string;
}

export interface AnswerKey {
  [key: number]: string; // questionNumber -> answer (a/b/c/d)
}

/**
 * Extract answer key from text like:
 * "General English: 1-b, 2-d, 3-c, 4-b..."
 */
export function extractAnswerKey(text: string): AnswerKey {
  const answerKey: AnswerKey = {};
  
  // Find ANSWER KEY section
  const answerKeyMatch = text.match(/ANSWER\s+KEY\s*\n([\s\S]+?)(?:\n\n|$)/i);
  if (!answerKeyMatch) return answerKey;
  
  const answerSection = answerKeyMatch[1];
  
  // Match patterns like "1-b" or "31-c"
  const answerPattern = /(\d+)-([a-d])/gi;
  let match;
  
  while ((match = answerPattern.exec(answerSection)) !== null) {
    const questionNum = parseInt(match[1]);
    const answer = match[2].toUpperCase();
    answerKey[questionNum] = answer;
  }
  
  return answerKey;
}

/**
 * Extract questions from text with pattern matching
 * Handles formats like:
 * "1. Question text?
 *  (a) Option A
 *  (b) Option B..."
 */
export function extractQuestions(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  
  // Remove answer key section to avoid confusion
  const cleanText = text.replace(/ANSWER\s+KEY[\s\S]+$/i, '');
  
  // Match question patterns
  // Pattern: number. question text (a) option (b) option (c) option (d) option
  const questionPattern = /(\d+)\.\s+(.+?)\n\s*\(a\)\s+(.+?)\n\s*\(b\)\s+(.+?)\n\s*\(c\)\s+(.+?)\n\s*\(d\)\s+(.+?)(?=\n\d+\.|$)/gi;
  
  let match;
  while ((match = questionPattern.exec(cleanText)) !== null) {
    const questionNum = parseInt(match[1]);
    const questionText = match[2].trim();
    const optionA = match[3].trim();
    const optionB = match[4].trim();
    const optionC = match[5].trim();
    const optionD = match[6].trim();
    
    questions.push({
      questionNumber: questionNum,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption: null // Will be filled from answer key
    });
  }
  
  return questions;
}

/**
 * Merge questions with answer key
 */
export function mergeAnswerKey(questions: ParsedQuestion[], answerKey: AnswerKey): ParsedQuestion[] {
  return questions.map((q: any) => ({
    ...q,
    correctOption: answerKey[q.questionNumber] || null
  }));
}

/**
 * Detect section/subject from context
 */
export function detectSection(text: string, questionNumber: number): { section?: string; subject?: string } {
  const beforeQuestion = text.substring(0, text.indexOf(`${questionNumber}.`));
  
  // Find the last section header before this question
  const sectionMatch = beforeQuestion.match(/(?:SECTION|PART)\s+([A-Z][:)\s]+.+?)(?=\n)/i);
  const subjectMatch = beforeQuestion.match(/([A-Z\s&]+)\s*\((?:\d+\s+Questions|\d+\s+Marks)\)/i);
  
  return {
    section: sectionMatch ? sectionMatch[1].trim() : undefined,
    subject: subjectMatch ? subjectMatch[1].trim() : undefined
  };
}

/**
 * Main parser - combines all extraction methods
 */
export function parseExamContent(text: string): ParsedQuestion[] {
  // Extract questions using pattern matching
  const questions = extractQuestions(text);
  
  // Extract answer key
  const answerKey = extractAnswerKey(text);
  
  // Merge answers
  const questionsWithAnswers = mergeAnswerKey(questions, answerKey);
  
  // Add section/subject context
  const questionsWithContext = questionsWithAnswers.map((q: any) => ({
    ...q,
    ...detectSection(text, q.questionNumber)
  }));
  
  return questionsWithContext;
}

/**
 * Convert parsed questions to database format
 */
export function convertToDBFormat(questions: ParsedQuestion[], category: string = 'General') {
  return questions.map((q: any) => ({
    questionText: q.questionText,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    correctOption: q.correctOption,
    explanation: `The correct answer is option ${q.correctOption}.`,
    difficulty: 'MEDIUM' as const,
    marks: 1,
    negativeMarks: 0,
    subject: q.subject || 'General Knowledge',
    topic: q.section || 'General',
    questionType: 'MCQ' as const,
    category: category
  }));
}

/**
 * Chunk large arrays for processing
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}
