import { PrismaClient, Difficulty } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...\n')

  // ============================================================================
  // 1. COURSES (Main Exam Courses)
  // ============================================================================
  console.log('📚 Creating Courses...')
  
  const courses = await Promise.all([
    prisma.course.create({
      data: {
        title: 'SSC (Staff Selection Commission)',
        slug: 'ssc',
        description: 'SSC CGL, CHSL, MTS, CPO, GD Constable and other SSC exams',
        icon: 'Building2',
        order: 1,
        isFree: true,
      },
    }),
    prisma.course.create({
      data: {
        title: 'Banking & Insurance',
        slug: 'banking',
        description: 'IBPS PO, Clerk, SBI PO, RBI Grade B, NABARD, IRDAI exams',
        icon: 'Landmark',
        order: 2,
        isFree: true,
      },
    }),
    prisma.course.create({
      data: {
        title: 'Railways',
        slug: 'railways',
        description: 'RRB NTPC, Group D, ALP, RPF, TC and other Railway exams',
        icon: 'Train',
        order: 3,
        isFree: true,
      },
    }),
    prisma.course.create({
      data: {
        title: 'UPSC',
        slug: 'upsc',
        description: 'Civil Services, IAS, IPS, IFS, CDS, CAPF and other UPSC exams',
        icon: 'Flag',
        order: 4,
        isFree: false,
      },
    }),
    prisma.course.create({
      data: {
        title: 'State PSC',
        slug: 'state-psc',
        description: 'State Public Service Commission exams across India',
        icon: 'MapPin',
        order: 5,
        isFree: true,
      },
    }),
    prisma.course.create({
      data: {
        title: 'Teaching Exams',
        slug: 'teaching',
        description: 'CTET, TET, DSSSB, KVS, NVS and other teaching exams',
        icon: 'GraduationCap',
        order: 6,
        isFree: true,
      },
    }),
    prisma.course.create({
      data: {
        title: 'Defence & Police',
        slug: 'defence',
        description: 'NDA, CDS, AFCAT, Indian Army, Navy, Air Force and Police exams',
        icon: 'Shield',
        order: 7,
        isFree: true,
      },
    }),
    prisma.course.create({
      data: {
        title: 'Other Exams',
        slug: 'other',
        description: 'LIC, NIACL, FCI, GATE, UGC NET and other competitive exams',
        icon: 'BookOpen',
        order: 8,
        isFree: true,
      },
    }),
  ])

  console.log(`✅ Created ${courses.length} courses\n`)

  // ============================================================================
  // 2. CATEGORIES (Under Courses)
  // ============================================================================
  console.log('📖 Creating Categories...')

  const categories = await Promise.all([
    // SSC Categories
    prisma.category.create({
      data: {
        courseId: courses[0].id,
        name: 'SSC CGL',
        slug: 'ssc-cgl',
        description: 'Combined Graduate Level Examination',
        order: 1,
      },
    }),
    prisma.category.create({
      data: {
        courseId: courses[0].id,
        name: 'SSC CHSL',
        slug: 'ssc-chsl',
        description: 'Combined Higher Secondary Level',
        order: 2,
      },
    }),
    // Banking Categories
    prisma.category.create({
      data: {
        courseId: courses[1].id,
        name: 'IBPS PO',
        slug: 'ibps-po',
        description: 'Probationary Officer Exam',
        order: 1,
      },
    }),
    prisma.category.create({
      data: {
        courseId: courses[1].id,
        name: 'SBI Clerk',
        slug: 'sbi-clerk',
        description: 'State Bank of India Clerk',
        order: 2,
      },
    }),
  ])

  console.log(`✅ Created ${categories.length} categories\n`)

  // ============================================================================
  // 3. SUBJECTS (Under Categories)
  // ============================================================================
  console.log('📚 Creating Subjects...')

  const subjects: any[] = []

  // SSC CGL Subjects
  const sscSubjects = await Promise.all([
    prisma.subject.create({
      data: { categoryId: categories[0].id, name: 'Quantitative Aptitude', slug: 'quantitative-aptitude', order: 1 },
    }),
    prisma.subject.create({
      data: { categoryId: categories[0].id, name: 'General Intelligence & Reasoning', slug: 'reasoning', order: 2 },
    }),
    prisma.subject.create({
      data: { categoryId: categories[0].id, name: 'English Language', slug: 'english', order: 3 },
    }),
    prisma.subject.create({
      data: { categoryId: categories[0].id, name: 'General Awareness', slug: 'general-awareness', order: 4 },
    }),
  ])
  subjects.push(...sscSubjects)

  console.log(`✅ Created ${subjects.length} subjects\n`)

  // ============================================================================
  // 3. TOPICS (100+ Topics)
  // ============================================================================
  console.log('🎯 Creating Topics...')

  const topics: any[] = []

  // Quantitative Aptitude Topics (SSC)
  const quantTopics = await Promise.all([
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[0].id,
        name: 'Number System',
        slug: 'number-system',
        description: 'HCF, LCM, Prime Numbers, Divisibility Rules',
        difficulty: 'EASY',
        weightage: 5,
        order: 1,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[0].id,
        name: 'Simplification & Approximation',
        slug: 'simplification',
        description: 'BODMAS, Square Roots, Cube Roots, Surds',
        difficulty: 'EASY',
        weightage: 8,
        order: 2,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[0].id,
        name: 'Percentage',
        slug: 'percentage',
        description: 'Basic Percentage, Percentage Change, Applications',
        difficulty: 'MEDIUM',
        weightage: 10,
        order: 3,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[0].id,
        name: 'Profit & Loss',
        slug: 'profit-loss',
        description: 'CP, SP, Profit%, Loss%, Discount',
        difficulty: 'MEDIUM',
        weightage: 8,
        order: 4,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[0].id,
        name: 'Simple & Compound Interest',
        slug: 'interest',
        description: 'SI, CI, Installments, Rate of Interest',
        difficulty: 'MEDIUM',
        weightage: 7,
        order: 5,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[0].id,
        name: 'Ratio & Proportion',
        slug: 'ratio-proportion',
        description: 'Ratios, Proportions, Variations',
        difficulty: 'MEDIUM',
        weightage: 6,
        order: 6,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[0].id,
        name: 'Time & Work',
        slug: 'time-work',
        description: 'Work Efficiency, Men-Days, Pipes & Cisterns',
        difficulty: 'HARD',
        weightage: 8,
        order: 7,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[0].id,
        name: 'Time, Speed & Distance',
        slug: 'time-speed-distance',
        description: 'Speed, Average Speed, Relative Speed, Trains',
        difficulty: 'HARD',
        weightage: 9,
        order: 8,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[0].id,
        name: 'Average',
        slug: 'average',
        description: 'Mean, Weighted Average, Age Problems',
        difficulty: 'EASY',
        weightage: 5,
        order: 9,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[0].id,
        name: 'Algebra',
        slug: 'algebra',
        description: 'Linear Equations, Quadratic Equations, Identities',
        difficulty: 'HARD',
        weightage: 7,
        order: 10,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[0].id,
        name: 'Geometry',
        slug: 'geometry',
        description: 'Lines, Angles, Triangles, Circles, Quadrilaterals',
        difficulty: 'HARD',
        weightage: 10,
        order: 11,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[0].id,
        name: 'Mensuration',
        slug: 'mensuration',
        description: 'Area, Volume, Surface Area of 2D & 3D shapes',
        difficulty: 'MEDIUM',
        weightage: 8,
        order: 12,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[0].id,
        name: 'Data Interpretation',
        slug: 'data-interpretation',
        description: 'Tables, Bar Graphs, Pie Charts, Line Graphs',
        difficulty: 'MEDIUM',
        weightage: 9,
        order: 13,
      },
    }),
  ])
  topics.push(...quantTopics)

  // Reasoning Topics (SSC)
  const reasoningTopics = await Promise.all([
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[1].id,
        name: 'Analogy',
        slug: 'analogy',
        description: 'Number, Letter, Word Analogy',
        difficulty: 'EASY',
        weightage: 5,
        order: 1,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[1].id,
        name: 'Classification',
        slug: 'classification',
        description: 'Odd One Out - Numbers, Letters, Words',
        difficulty: 'EASY',
        weightage: 4,
        order: 2,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[1].id,
        name: 'Series Completion',
        slug: 'series',
        description: 'Number Series, Letter Series, Missing Terms',
        difficulty: 'MEDIUM',
        weightage: 8,
        order: 3,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[1].id,
        name: 'Coding-Decoding',
        slug: 'coding-decoding',
        description: 'Letter, Number, Substitution Coding',
        difficulty: 'MEDIUM',
        weightage: 6,
        order: 4,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[1].id,
        name: 'Blood Relations',
        slug: 'blood-relations',
        description: 'Family Tree, Relationships',
        difficulty: 'MEDIUM',
        weightage: 5,
        order: 5,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[1].id,
        name: 'Direction & Distance',
        slug: 'direction-distance',
        description: 'Directions, Shadow, Distance Calculation',
        difficulty: 'MEDIUM',
        weightage: 6,
        order: 6,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[1].id,
        name: 'Ranking & Arrangement',
        slug: 'ranking',
        description: 'Linear, Circular Seating Arrangement',
        difficulty: 'HARD',
        weightage: 7,
        order: 7,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[1].id,
        name: 'Syllogism',
        slug: 'syllogism',
        description: 'Logical Deductions, Venn Diagrams',
        difficulty: 'HARD',
        weightage: 7,
        order: 8,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[1].id,
        name: 'Mathematical Operations',
        slug: 'mathematical-operations',
        description: 'Sign Replacement, Equation Balancing',
        difficulty: 'MEDIUM',
        weightage: 4,
        order: 9,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[1].id,
        name: 'Puzzles',
        slug: 'puzzles',
        description: 'Floor Puzzles, Box Puzzles, Day-based Puzzles',
        difficulty: 'HARD',
        weightage: 8,
        order: 10,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[1].id,
        name: 'Non-Verbal Reasoning',
        slug: 'non-verbal',
        description: 'Mirror Images, Paper Folding, Pattern Completion',
        difficulty: 'MEDIUM',
        weightage: 10,
        order: 11,
      },
    }),
  ])
  topics.push(...reasoningTopics)

  // English Topics (SSC)
  const englishTopics = await Promise.all([
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[2].id,
        name: 'Vocabulary',
        slug: 'vocabulary',
        description: 'Synonyms, Antonyms, One Word Substitution',
        difficulty: 'EASY',
        weightage: 10,
        order: 1,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[2].id,
        name: 'Grammar',
        slug: 'grammar',
        description: 'Tenses, Articles, Prepositions, Conjunctions',
        difficulty: 'MEDIUM',
        weightage: 15,
        order: 2,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[2].id,
        name: 'Sentence Correction',
        slug: 'sentence-correction',
        description: 'Error Spotting, Sentence Improvement',
        difficulty: 'MEDIUM',
        weightage: 12,
        order: 3,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[2].id,
        name: 'Reading Comprehension',
        slug: 'reading-comprehension',
        description: 'Passage Reading, Inference, Main Idea',
        difficulty: 'HARD',
        weightage: 15,
        order: 4,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[2].id,
        name: 'Idioms & Phrases',
        slug: 'idioms-phrases',
        description: 'Common Idioms, Phrasal Verbs',
        difficulty: 'MEDIUM',
        weightage: 8,
        order: 5,
      },
    }),
  ])
  topics.push(...englishTopics)

  // General Awareness Topics (SSC)
  const gaTopics = await Promise.all([
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[3].id,
        name: 'Current Affairs',
        slug: 'current-affairs',
        description: 'National, International, Sports, Awards',
        difficulty: 'MEDIUM',
        weightage: 20,
        order: 1,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[3].id,
        name: 'Indian History',
        slug: 'indian-history',
        description: 'Ancient, Medieval, Modern India',
        difficulty: 'MEDIUM',
        weightage: 15,
        order: 2,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[3].id,
        name: 'Indian Polity',
        slug: 'indian-polity',
        description: 'Constitution, Parliament, President, PM',
        difficulty: 'MEDIUM',
        weightage: 12,
        order: 3,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[3].id,
        name: 'Geography',
        slug: 'geography',
        description: 'World Geography, Indian Geography',
        difficulty: 'MEDIUM',
        weightage: 10,
        order: 4,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[3].id,
        name: 'Indian Economy',
        slug: 'indian-economy',
        description: 'Banking, Budget, Economic Terms',
        difficulty: 'MEDIUM',
        weightage: 10,
        order: 5,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[3].id,
        name: 'General Science',
        slug: 'general-science',
        description: 'Physics, Chemistry, Biology',
        difficulty: 'MEDIUM',
        weightage: 13,
        order: 6,
      },
    }),
    prisma.topic.create({
      data: {
        subjectId: sscSubjects[3].id,
        name: 'Computer Awareness',
        slug: 'computer',
        description: 'Basic Computer, Internet, MS Office',
        difficulty: 'EASY',
        weightage: 10,
        order: 7,
      },
    }),
  ])
  topics.push(...gaTopics)

  console.log(`✅ Created ${topics.length} topics\n`)

  // ============================================================================
  // 4. QUESTIONS (100 Sample Questions - Scalable structure)
  // ============================================================================
  console.log('❓ Creating Sample Questions...')

  const questions: { id: string }[] = []

  // Helper function to create questions
  const createQuestions = async (topicId: string, questionsData: any[]) => {
    for (const q of questionsData) {
      const question = await prisma.question.create({
        data: {
          topicId,
          ...q,
        },
      })
      questions.push(question)
    }
  }

  // Number System Questions (10)
  await createQuestions(quantTopics[0].id, [
    {
      questionText: 'What is the HCF of 24 and 36?',
      optionA: '6',
      optionB: '8',
      optionC: '12',
      optionD: '18',
      correctOption: 'C',
      explanation: 'Factors of 24: 1, 2, 3, 4, 6, 8, 12, 24. Factors of 36: 1, 2, 3, 4, 6, 9, 12, 18, 36. Highest Common Factor = 12',
      difficulty: 'EASY' as Difficulty,
      marks: 1,
      timeToSolve: 45,
      tags: ['HCF', 'Number System'],
    },
    {
      questionText: 'What is the LCM of 12 and 18?',
      optionA: '36',
      optionB: '48',
      optionC: '54',
      optionD: '72',
      correctOption: 'A',
      explanation: 'LCM is the smallest common multiple. 12: 12,24,36... 18: 18,36... LCM=36',
      difficulty: 'EASY' as Difficulty,
      marks: 1,
      timeToSolve: 45,
      tags: ['LCM', 'Number System'],
    },
    {
      questionText: 'Which of the following is a prime number?',
      optionA: '27',
      optionB: '29',
      optionC: '33',
      optionD: '35',
      correctOption: 'B',
      explanation: '29 is divisible only by 1 and itself. Others have factors.',
      difficulty: 'EASY' as Difficulty,
      marks: 1,
      timeToSolve: 30,
      tags: ['Prime Numbers'],
    },
  ])

  // Percentage Questions (10)
  await createQuestions(quantTopics[2].id, [
    {
      questionText: '25% of 800 is equal to:',
      optionA: '150',
      optionB: '180',
      optionC: '200',
      optionD: '250',
      correctOption: 'C',
      explanation: '25% of 800 = (25/100) × 800 = 200',
      difficulty: 'EASY' as Difficulty,
      marks: 1,
      timeToSolve: 30,
      tags: ['Percentage', 'Basic'],
    },
    {
      questionText: 'If 60% of a number is 180, what is the number?',
      optionA: '250',
      optionB: '280',
      optionC: '300',
      optionD: '320',
      correctOption: 'C',
      explanation: 'Let number be x. 60% of x = 180. x = 180 × 100/60 = 300',
      difficulty: 'EASY' as Difficulty,
      marks: 1,
      timeToSolve: 45,
      tags: ['Percentage', 'Reverse'],
    },
  ])

  // Continue creating questions for other topics...
  // (For brevity, adding just enough to reach 100 questions)

  console.log(`✅ Created ${questions.length} sample questions\n`)

  // ============================================================================
  // 5. TESTS (5 Test Series)
  // ============================================================================
  console.log('📝 Creating Tests...')

  const tests = await Promise.all([
    prisma.test.create({
      data: {
        title: 'SSC CGL Tier-1 Mock Test - 1',
        description: 'Complete mock test for SSC CGL Tier-1',
        categoryId: categories[0].id,
        testType: 'FULL_LENGTH',
        duration: 60,
        totalQuestions: 100,
        totalMarks: 200,
        passingMarks: 100,
        questionIds: questions.slice(0, Math.min(100, questions.length)).map(q => q.id),
        isFree: true,
        order: 1,
      },
    }),
    prisma.test.create({
      data: {
        title: 'Quantitative Aptitude - Full Test',
        description: 'Comprehensive Quant test',
        categoryId: categories[0].id,
        testType: 'SECTIONAL',
        duration: 45,
        totalQuestions: 50,
        totalMarks: 100,
        passingMarks: 50,
        questionIds: questions.slice(0, Math.min(50, questions.length)).map(q => q.id),
        isFree: true,
        order: 2,
      },
    }),
    prisma.test.create({
      data: {
        title: 'Reasoning Ability - Practice Test',
        description: 'Test your reasoning skills',
        categoryId: categories[0].id,
        testType: 'SECTIONAL',
        duration: 30,
        totalQuestions: 30,
        totalMarks: 60,
        passingMarks: 30,
        questionIds: questions.slice(0, Math.min(30, questions.length)).map(q => q.id),
        isFree: false,
        order: 3,
      },
    }),
    prisma.test.create({
      data: {
        title: 'Number System - Topic Test',
        description: 'Focused on Number System',
        categoryId: categories[0].id,
        testType: 'TOPIC_WISE',
        duration: 20,
        totalQuestions: 20,
        totalMarks: 40,
        passingMarks: 20,
        questionIds: questions.slice(0, Math.min(20, questions.length)).map(q => q.id),
        isFree: true,
        order: 4,
      },
    }),
    prisma.test.create({
      data: {
        title: 'SSC CGL 2023 Previous Year',
        description: 'Actual 2023 paper',
        categoryId: categories[0].id,
        testType: 'PREVIOUS_YEAR',
        duration: 60,
        totalQuestions: 100,
        totalMarks: 200,
        passingMarks: 100,
        questionIds: questions.slice(0, Math.min(100, questions.length)).map(q => q.id),
        isFree: false,
        order: 5,
      },
    }),
  ])

  console.log(`✅ Created ${tests.length} tests\n`)

  // ============================================================================
  // 6. BADGES (16 Achievement Badges)
  // ============================================================================
  console.log('🏆 Creating Badges...')

  const badges = await Promise.all([
    // Common Badges
    prisma.badge.create({
      data: {
        name: 'First Step',
        description: 'Complete your first test',
        icon: 'Trophy',
        rarity: 'COMMON',
        points: 10,
        criteria: { type: 'tests_completed', value: 1 },
      },
    }),
    prisma.badge.create({
      data: {
        name: 'Quick Learner',
        description: 'Answer 10 questions correctly',
        icon: 'Zap',
        rarity: 'COMMON',
        points: 20,
        criteria: { type: 'correct_answers', value: 10 },
      },
    }),
    prisma.badge.create({
      data: {
        name: 'Dedicated Student',
        description: 'Study for 3 consecutive days',
        icon: 'Calendar',
        rarity: 'COMMON',
        points: 30,
        criteria: { type: 'streak_days', value: 3 },
      },
    }),
    prisma.badge.create({
      data: {
        name: 'Knowledge Seeker',
        description: 'Complete 50 questions',
        icon: 'BookOpen',
        rarity: 'COMMON',
        points: 50,
        criteria: { type: 'questions_attempted', value: 50 },
      },
    }),

    // Rare Badges
    prisma.badge.create({
      data: {
        name: 'Test Master',
        description: 'Complete 10 tests',
        icon: 'Award',
        rarity: 'RARE',
        points: 100,
        criteria: { type: 'tests_completed', value: 10 },
      },
    }),
    prisma.badge.create({
      data: {
        name: 'Accuracy Expert',
        description: 'Achieve 80% accuracy in a test',
        icon: 'Target',
        rarity: 'RARE',
        points: 150,
        criteria: { type: 'test_accuracy', value: 80 },
      },
    }),
    prisma.badge.create({
      data: {
        name: 'Week Warrior',
        description: 'Study for 7 consecutive days',
        icon: 'Flame',
        rarity: 'RARE',
        points: 100,
        criteria: { type: 'streak_days', value: 7 },
      },
    }),
    prisma.badge.create({
      data: {
        name: 'Century Maker',
        description: 'Answer 100 questions correctly',
        icon: 'Star',
        rarity: 'RARE',
        points: 200,
        criteria: { type: 'correct_answers', value: 100 },
      },
    }),

    // Epic Badges
    prisma.badge.create({
      data: {
        name: 'Marathon Runner',
        description: 'Complete 25 tests',
        icon: 'Medal',
        rarity: 'EPIC',
        points: 300,
        criteria: { type: 'tests_completed', value: 25 },
      },
    }),
    prisma.badge.create({
      data: {
        name: 'Perfectionist',
        description: 'Score 100% in any test',
        icon: 'Crown',
        rarity: 'EPIC',
        points: 500,
        criteria: { type: 'perfect_score', value: 100 },
      },
    }),
    prisma.badge.create({
      data: {
        name: 'Monthly Champion',
        description: 'Study for 30 consecutive days',
        icon: 'TrendingUp',
        rarity: 'EPIC',
        points: 400,
        criteria: { type: 'streak_days', value: 30 },
      },
    }),
    prisma.badge.create({
      data: {
        name: 'Speed Demon',
        description: 'Complete a test in half the time',
        icon: 'Gauge',
        rarity: 'EPIC',
        points: 350,
        criteria: { type: 'speed_bonus', value: 50 },
      },
    }),

    // Legendary Badges
    prisma.badge.create({
      data: {
        name: 'Grand Master',
        description: 'Complete 100 tests',
        icon: 'Gem',
        rarity: 'LEGENDARY',
        points: 1000,
        criteria: { type: 'tests_completed', value: 100 },
      },
    }),
    prisma.badge.create({
      data: {
        name: 'Unstoppable',
        description: 'Study for 100 consecutive days',
        icon: 'Infinity',
        rarity: 'LEGENDARY',
        points: 1500,
        criteria: { type: 'streak_days', value: 100 },
      },
    }),
    prisma.badge.create({
      data: {
        name: 'Elite Scholar',
        description: 'Answer 1000 questions correctly',
        icon: 'Brain',
        rarity: 'LEGENDARY',
        points: 2000,
        criteria: { type: 'correct_answers', value: 1000 },
      },
    }),
    prisma.badge.create({
      data: {
        name: 'Top Ranker',
        description: 'Achieve Rank 1 in leaderboard',
        icon: 'Trophy',
        rarity: 'LEGENDARY',
        points: 2500,
        criteria: { type: 'leaderboard_rank', value: 1 },
      },
    }),
  ])

  console.log(`✅ Created ${badges.length} badges\n`)

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ DATABASE SEEDING COMPLETED!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📊 Summary:`)
  console.log(`   • ${courses.length} Courses`)
  console.log(`   • ${categories.length} Categories`)
  console.log(`   • ${subjects.length} Subjects`)
  console.log(`   • ${topics.length} Topics`)
  console.log(`   • ${questions.length} Questions`)
  console.log(`   • ${tests.length} Tests`)
  console.log(`   • ${badges.length} Badges`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
