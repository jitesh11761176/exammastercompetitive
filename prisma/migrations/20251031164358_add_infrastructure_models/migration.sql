-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'INSTRUCTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'MSQ', 'INTEGER', 'RANGE', 'SUBJECTIVE', 'TRUE_FALSE', 'MATCH_COLUMN');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVISION');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('FULL_LENGTH', 'SECTIONAL', 'TOPIC_WISE', 'PREVIOUS_YEAR', 'CUSTOM', 'DAILY_CHALLENGE', 'SPEED_TEST');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('QUESTIONS_COUNT', 'TESTS_COUNT', 'ACCURACY_TARGET', 'TOPIC_COMPLETION', 'TIME_SPENT', 'STREAK_DAYS');

-- CreateEnum
CREATE TYPE "BadgeRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "LeaderboardPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('WRONG_ANSWER', 'WRONG_QUESTION', 'UNCLEAR', 'DUPLICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "QuestionGenerationStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_REVISION');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('PENDING', 'AI_EVALUATED', 'MANUALLY_REVIEWED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "UploadType" AS ENUM ('QUESTION_PAPER', 'SOLUTION_SHEET', 'STUDY_MATERIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('NEXT_BEST_TEST', 'WEAK_TOPIC_PRACTICE', 'SPACED_REPETITION', 'SIMILAR_STUDENTS', 'TRENDING', 'PREREQUISITE');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('VIEW', 'START', 'COMPLETE', 'BOOKMARK', 'SHARE', 'SKIP', 'HINT_USED');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TEST_REMINDER', 'CHALLENGE_AVAILABLE', 'STREAK_MILESTONE', 'ACHIEVEMENT_UNLOCKED', 'SUBSCRIPTION_EXPIRING', 'NEW_CONTENT', 'STUDY_REMINDER', 'PERFORMANCE_INSIGHT');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'BASIC', 'PREMIUM', 'ULTIMATE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY', 'LIFETIME');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE', 'RAZORPAY', 'PAYPAL', 'CREDIT_CARD', 'UPI');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_LOGIN', 'USER_LOGOUT', 'USER_REGISTER', 'USER_UPDATE', 'USER_DELETE', 'QUESTION_CREATE', 'QUESTION_UPDATE', 'QUESTION_DELETE', 'QUESTION_APPROVE', 'QUESTION_REJECT', 'TEST_CREATE', 'TEST_UPDATE', 'TEST_DELETE', 'TEST_PUBLISH', 'TEST_START', 'TEST_SUBMIT', 'TEST_REVIEW', 'PAYMENT_INITIATED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_CANCELLED', 'BULK_IMPORT', 'BULK_EXPORT', 'SETTINGS_UPDATE', 'ROLE_CHANGE', 'PASSWORD_RESET', 'EMAIL_VERIFIED', 'SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_HIT', 'AI_CHAT', 'AI_HINT_USED', 'AI_QUESTION_GENERATED');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('SUCCESS', 'FAILURE', 'PENDING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ErrorSeverity" AS ENUM ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('SCORE_TEST', 'GENERATE_ANALYTICS', 'GENERATE_RANK', 'EXPORT_PDF', 'EXPORT_CSV', 'EXPORT_REPORT', 'SEND_EMAIL', 'SEND_BULK_EMAIL', 'SEND_REMINDER', 'INDEX_QUESTION', 'INDEX_TEST', 'REINDEX_ALL', 'AI_GENERATE_QUESTIONS', 'AI_EVALUATE_SUBJECTIVE', 'AI_EXTRACT_DOCUMENT', 'CLEANUP_OLD_DATA', 'CLEANUP_TEMP_FILES', 'PURGE_LOGS', 'SEND_PUSH_NOTIFICATION', 'SEND_CHALLENGE_REMINDER', 'PROCESS_REFUND', 'SYNC_SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'FAILED', 'DELAYED', 'CANCELLED', 'STUCK');

-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM ('FAILED_LOGIN', 'BRUTE_FORCE_ATTEMPT', 'SUSPICIOUS_IP', 'MULTIPLE_DEVICES', 'PASSWORD_CHANGED', 'EMAIL_CHANGED', 'UNUSUAL_ACTIVITY', 'API_KEY_LEAKED', 'CSRF_ATTEMPT', 'XSS_ATTEMPT', 'SQL_INJECTION_ATTEMPT', 'RATE_LIMIT_EXCEEDED', 'INVALID_TOKEN', 'UNAUTHORIZED_ACCESS');

-- CreateEnum
CREATE TYPE "SecuritySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('USER_REGISTERED', 'USER_VERIFIED', 'TEST_COMPLETED', 'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_CANCELLED', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'QUESTION_REPORTED', 'ACHIEVEMENT_UNLOCKED', 'DAILY_CHALLENGE_COMPLETED', 'STREAK_MILESTONE');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'RETRYING');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "weightage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL DEFAULT 'MCQ',
    "questionText" TEXT NOT NULL,
    "questionImage" TEXT,
    "mathContent" TEXT,
    "optionA" TEXT,
    "optionB" TEXT,
    "optionC" TEXT,
    "optionD" TEXT,
    "optionE" TEXT,
    "optionF" TEXT,
    "correctOption" TEXT,
    "correctOptions" TEXT[],
    "integerAnswer" INTEGER,
    "rangeMin" DOUBLE PRECISION,
    "rangeMax" DOUBLE PRECISION,
    "explanation" TEXT NOT NULL,
    "solutionSteps" JSONB,
    "explanationVideoUrl" TEXT,
    "mathSolution" TEXT,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "marks" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "partialMarking" BOOLEAN NOT NULL DEFAULT false,
    "partialMarkingRules" JSONB,
    "timeToSolve" INTEGER NOT NULL DEFAULT 60,
    "yearAsked" INTEGER,
    "examName" TEXT,
    "timesAttempted" INTEGER NOT NULL DEFAULT 0,
    "timesCorrect" INTEGER NOT NULL DEFAULT 0,
    "timesPartialCorrect" INTEGER NOT NULL DEFAULT 0,
    "averageTimeTaken" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "createdBy" TEXT,
    "verifiedBy" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "moderationNotes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentQuestionId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "testType" "TestType" NOT NULL DEFAULT 'FULL_LENGTH',
    "duration" INTEGER NOT NULL,
    "sectionDurations" JSONB,
    "totalQuestions" INTEGER NOT NULL,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "passingMarks" DOUBLE PRECISION NOT NULL,
    "questionIds" TEXT[],
    "sections" JSONB,
    "instructions" TEXT,
    "hasNegativeMarking" BOOLEAN NOT NULL DEFAULT true,
    "negativeMarkingRules" JSONB,
    "allowReview" BOOLEAN NOT NULL DEFAULT true,
    "allowReattempt" BOOLEAN NOT NULL DEFAULT true,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "showSolutions" BOOLEAN NOT NULL DEFAULT true,
    "solutionsAvailableAfter" TIMESTAMP(3),
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT false,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "requiredPlan" "SubscriptionPlan",
    "unlockPoints" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "timeTaken" INTEGER,
    "sectionTimings" JSONB,
    "answers" JSONB NOT NULL,
    "markedForReview" TEXT[],
    "visitedQuestions" TEXT[],
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "wrongAnswers" INTEGER NOT NULL DEFAULT 0,
    "partialCorrect" INTEGER NOT NULL DEFAULT 0,
    "unattempted" INTEGER NOT NULL DEFAULT 0,
    "sectionScores" JSONB,
    "rank" INTEGER,
    "percentile" DOUBLE PRECISION,
    "detailedReport" JSONB,
    "weakTopics" TEXT[],
    "strongTopics" TEXT[],
    "solutionsViewed" BOOLEAN NOT NULL DEFAULT false,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "isCorrect" BOOLEAN NOT NULL,
    "isPartialCorrect" BOOLEAN NOT NULL DEFAULT false,
    "selectedOption" TEXT,
    "selectedOptions" TEXT[],
    "integerAnswer" INTEGER,
    "timeTaken" INTEGER NOT NULL,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "solutionViewed" BOOLEAN NOT NULL DEFAULT false,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalTestsAttempted" INTEGER NOT NULL DEFAULT 0,
    "totalQuestionsAttempted" INTEGER NOT NULL DEFAULT 0,
    "totalCorrect" INTEGER NOT NULL DEFAULT 0,
    "totalWrong" INTEGER NOT NULL DEFAULT 0,
    "totalPartialCorrect" INTEGER NOT NULL DEFAULT 0,
    "overallAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "averageSpeed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3),
    "strongTopics" TEXT[],
    "weakTopics" TEXT[],
    "topicWiseAccuracy" JSONB,
    "subjectWiseAccuracy" JSONB,
    "preferredStudyTime" TEXT,
    "peakPerformanceHour" INTEGER,
    "averageSessionDuration" INTEGER NOT NULL DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "cohortMonth" TEXT,
    "retentionDay1" BOOLEAN NOT NULL DEFAULT false,
    "retentionDay7" BOOLEAN NOT NULL DEFAULT false,
    "retentionDay30" BOOLEAN NOT NULL DEFAULT false,
    "daysSinceSignup" INTEGER NOT NULL DEFAULT 0,
    "accuracyTrend" JSONB,
    "speedTrend" JSONB,
    "timeTrend" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "targetExam" TEXT NOT NULL,
    "examDate" TIMESTAMP(3),
    "dailyTargetQuestions" INTEGER NOT NULL DEFAULT 50,
    "dailyTargetMinutes" INTEGER NOT NULL DEFAULT 120,
    "dailyTargetTopics" INTEGER NOT NULL DEFAULT 3,
    "weeklyTargetTests" INTEGER NOT NULL DEFAULT 3,
    "weeklyTargetChapters" INTEGER NOT NULL DEFAULT 5,
    "topicsToCover" JSONB NOT NULL,
    "weeklySchedule" JSONB NOT NULL,
    "milestones" JSONB,
    "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "questionsCompleted" INTEGER NOT NULL DEFAULT 0,
    "testsCompleted" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "reminderTime" TEXT,
    "reminderDays" TEXT[],
    "emailReminders" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_goals" (
    "id" TEXT NOT NULL,
    "studyPlanId" TEXT NOT NULL,
    "goalType" "GoalType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studyPlanId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "questionsAttempted" INTEGER NOT NULL DEFAULT 0,
    "questionsCorrect" INTEGER NOT NULL DEFAULT 0,
    "topicsCovered" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gamification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "experiencePoints" INTEGER NOT NULL DEFAULT 0,
    "dailyStreak" INTEGER NOT NULL DEFAULT 0,
    "weeklyRank" INTEGER,
    "monthlyRank" INTEGER,
    "allTimeRank" INTEGER,
    "lastPointEarned" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gamification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "rarity" "BadgeRarity" NOT NULL DEFAULT 'COMMON',
    "points" INTEGER NOT NULL DEFAULT 0,
    "criteria" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDisplayed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT,
    "period" "LeaderboardPeriod" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "testsTaken" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_reports" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "description" TEXT NOT NULL,
    "suggestedCorrection" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "rewardGiven" INTEGER NOT NULL DEFAULT 0,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_categories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New Chat',
    "questionId" TEXT,
    "context" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "tokens" INTEGER,
    "ragSources" JSONB,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_hints" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "hintLevel" INTEGER NOT NULL,
    "hintText" TEXT NOT NULL,
    "affectsScore" BOOLEAN NOT NULL DEFAULT true,
    "scoreReduction" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_hints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generated_questions" (
    "id" TEXT NOT NULL,
    "sourceQuestionId" TEXT,
    "prompt" TEXT NOT NULL,
    "generatedData" JSONB NOT NULL,
    "aiModel" TEXT NOT NULL,
    "status" "QuestionGenerationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewedBy" TEXT,
    "approvedQuestionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ai_generated_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjective_evaluations" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "aiScore" DOUBLE PRECISION,
    "aiRubric" JSONB,
    "aiFeedback" TEXT,
    "aiModel" TEXT,
    "manualScore" DOUBLE PRECISION,
    "manualFeedback" TEXT,
    "evaluatedBy" TEXT,
    "finalScore" DOUBLE PRECISION,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluatedAt" TIMESTAMP(3),

    CONSTRAINT "subjective_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_uploads" (
    "id" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "uploadType" "UploadType" NOT NULL,
    "extractedText" TEXT,
    "aiProcessingStatus" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "aiModel" TEXT,
    "extractedQuestions" JSONB,
    "errorMessage" TEXT,
    "examName" TEXT,
    "year" INTEGER,
    "categoryId" TEXT,
    "subjectId" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recommendationType" "RecommendationType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "nextReviewDate" TIMESTAMP(3),
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "isViewed" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_interactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "interactionType" "InteractionType" NOT NULL,
    "timeSpent" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "score" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_index" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "categoryName" TEXT,
    "subjectName" TEXT,
    "topicName" TEXT,
    "difficulty" TEXT,
    "examName" TEXT,
    "year" INTEGER,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "searchVector" TEXT,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_index_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "deviceInfo" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offline_queue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttempt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offline_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "razorpayCustomerId" TEXT,
    "razorpaySubscriptionId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "trialEndsAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "testsLimit" INTEGER NOT NULL DEFAULT -1,
    "testsUsed" INTEGER NOT NULL DEFAULT 0,
    "questionsLimit" INTEGER NOT NULL DEFAULT -1,
    "questionsUsed" INTEGER NOT NULL DEFAULT 0,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "nextBillingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripePaymentId" TEXT,
    "razorpayPaymentId" TEXT,
    "razorpayOrderId" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "failureReason" TEXT,
    "receiptUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "maxUsesPerUser" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "applicablePlans" TEXT[],
    "minimumAmount" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_redemptions" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_challenges" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "testId" TEXT,
    "questionIds" TEXT[],
    "title" TEXT NOT NULL,
    "description" TEXT,
    "basePoints" INTEGER NOT NULL DEFAULT 50,
    "bonusPoints" INTEGER NOT NULL DEFAULT 20,
    "badgeId" TEXT,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "participantsCount" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_attempts" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "timeTaken" INTEGER NOT NULL,
    "rank" INTEGER,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "bonusEarned" BOOLEAN NOT NULL DEFAULT false,
    "badgeUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "userRole" "Role",
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "changes" JSONB,
    "metadata" JSONB,
    "status" "AuditStatus" NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_logs" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "code" TEXT,
    "severity" "ErrorSeverity" NOT NULL DEFAULT 'ERROR',
    "userId" TEXT,
    "path" TEXT,
    "method" TEXT,
    "query" JSONB,
    "body" JSONB,
    "headers" JSONB,
    "environment" TEXT,
    "version" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "metadata" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_metrics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "tags" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "queue" TEXT NOT NULL DEFAULT 'default',
    "data" JSONB NOT NULL,
    "result" JSONB,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "scheduledFor" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "error" TEXT,
    "stackTrace" TEXT,
    "createdBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_logs" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "identifierType" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "limit" INTEGER NOT NULL,
    "windowMs" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT,
    "organizationId" TEXT,
    "scopes" TEXT[],
    "permissions" JSONB,
    "lastUsedAt" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "rateLimit" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "type" "SecurityEventType" NOT NULL,
    "severity" "SecuritySeverity" NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "country" TEXT,
    "city" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cache_entries" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "tags" TEXT[],
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cache_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "data" JSONB NOT NULL,
    "source" TEXT,
    "userId" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "retries" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "description" TEXT,
    "events" "EventType"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastSuccess" TIMESTAMP(3),
    "lastFailure" TIMESTAMP(3),
    "lastError" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'POST',
    "headers" JSONB,
    "payload" JSONB NOT NULL,
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "responseTime" INTEGER,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_isActive_idx" ON "categories"("isActive");

-- CreateIndex
CREATE INDEX "subjects_categoryId_idx" ON "subjects"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_categoryId_slug_key" ON "subjects"("categoryId", "slug");

-- CreateIndex
CREATE INDEX "topics_subjectId_idx" ON "topics"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "topics_subjectId_slug_key" ON "topics"("subjectId", "slug");

-- CreateIndex
CREATE INDEX "questions_topicId_idx" ON "questions"("topicId");

-- CreateIndex
CREATE INDEX "questions_difficulty_idx" ON "questions"("difficulty");

-- CreateIndex
CREATE INDEX "questions_isActive_idx" ON "questions"("isActive");

-- CreateIndex
CREATE INDEX "questions_questionType_idx" ON "questions"("questionType");

-- CreateIndex
CREATE INDEX "questions_moderationStatus_idx" ON "questions"("moderationStatus");

-- CreateIndex
CREATE INDEX "questions_createdBy_idx" ON "questions"("createdBy");

-- CreateIndex
CREATE INDEX "tests_categoryId_idx" ON "tests"("categoryId");

-- CreateIndex
CREATE INDEX "tests_testType_idx" ON "tests"("testType");

-- CreateIndex
CREATE INDEX "tests_isFree_idx" ON "tests"("isFree");

-- CreateIndex
CREATE INDEX "tests_isPremium_idx" ON "tests"("isPremium");

-- CreateIndex
CREATE INDEX "tests_difficulty_idx" ON "tests"("difficulty");

-- CreateIndex
CREATE INDEX "test_attempts_userId_idx" ON "test_attempts"("userId");

-- CreateIndex
CREATE INDEX "test_attempts_testId_idx" ON "test_attempts"("testId");

-- CreateIndex
CREATE INDEX "test_attempts_status_idx" ON "test_attempts"("status");

-- CreateIndex
CREATE INDEX "test_attempts_createdAt_idx" ON "test_attempts"("createdAt");

-- CreateIndex
CREATE INDEX "user_progress_userId_idx" ON "user_progress"("userId");

-- CreateIndex
CREATE INDEX "user_progress_questionId_idx" ON "user_progress"("questionId");

-- CreateIndex
CREATE INDEX "user_progress_isCorrect_idx" ON "user_progress"("isCorrect");

-- CreateIndex
CREATE INDEX "user_progress_attemptedAt_idx" ON "user_progress"("attemptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_userId_questionId_key" ON "user_progress"("userId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_userId_key" ON "analytics"("userId");

-- CreateIndex
CREATE INDEX "analytics_userId_idx" ON "analytics"("userId");

-- CreateIndex
CREATE INDEX "analytics_cohortMonth_idx" ON "analytics"("cohortMonth");

-- CreateIndex
CREATE INDEX "study_plans_userId_idx" ON "study_plans"("userId");

-- CreateIndex
CREATE INDEX "study_plans_isActive_idx" ON "study_plans"("isActive");

-- CreateIndex
CREATE INDEX "study_goals_studyPlanId_idx" ON "study_goals"("studyPlanId");

-- CreateIndex
CREATE INDEX "study_goals_isCompleted_idx" ON "study_goals"("isCompleted");

-- CreateIndex
CREATE INDEX "study_sessions_userId_idx" ON "study_sessions"("userId");

-- CreateIndex
CREATE INDEX "study_sessions_studyPlanId_idx" ON "study_sessions"("studyPlanId");

-- CreateIndex
CREATE INDEX "study_sessions_startTime_idx" ON "study_sessions"("startTime");

-- CreateIndex
CREATE UNIQUE INDEX "gamification_userId_key" ON "gamification"("userId");

-- CreateIndex
CREATE INDEX "gamification_userId_idx" ON "gamification"("userId");

-- CreateIndex
CREATE INDEX "gamification_totalPoints_idx" ON "gamification"("totalPoints");

-- CreateIndex
CREATE INDEX "user_badges_userId_idx" ON "user_badges"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_userId_badgeId_key" ON "user_badges"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "leaderboard_period_rank_idx" ON "leaderboard"("period", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_userId_period_periodStart_key" ON "leaderboard"("userId", "period", "periodStart");

-- CreateIndex
CREATE INDEX "bookmarks_userId_idx" ON "bookmarks"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_userId_questionId_key" ON "bookmarks"("userId", "questionId");

-- CreateIndex
CREATE INDEX "question_reports_questionId_idx" ON "question_reports"("questionId");

-- CreateIndex
CREATE INDEX "question_reports_status_idx" ON "question_reports"("status");

-- CreateIndex
CREATE INDEX "user_categories_userId_idx" ON "user_categories"("userId");

-- CreateIndex
CREATE INDEX "user_categories_categoryId_idx" ON "user_categories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "user_categories_userId_categoryId_key" ON "user_categories"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "chat_sessions_userId_idx" ON "chat_sessions"("userId");

-- CreateIndex
CREATE INDEX "chat_sessions_questionId_idx" ON "chat_sessions"("questionId");

-- CreateIndex
CREATE INDEX "chat_messages_sessionId_idx" ON "chat_messages"("sessionId");

-- CreateIndex
CREATE INDEX "chat_messages_createdAt_idx" ON "chat_messages"("createdAt");

-- CreateIndex
CREATE INDEX "ai_hints_questionId_idx" ON "ai_hints"("questionId");

-- CreateIndex
CREATE INDEX "ai_generated_questions_status_idx" ON "ai_generated_questions"("status");

-- CreateIndex
CREATE INDEX "ai_generated_questions_createdAt_idx" ON "ai_generated_questions"("createdAt");

-- CreateIndex
CREATE INDEX "subjective_evaluations_attemptId_idx" ON "subjective_evaluations"("attemptId");

-- CreateIndex
CREATE INDEX "subjective_evaluations_status_idx" ON "subjective_evaluations"("status");

-- CreateIndex
CREATE INDEX "document_uploads_uploadedBy_idx" ON "document_uploads"("uploadedBy");

-- CreateIndex
CREATE INDEX "document_uploads_aiProcessingStatus_idx" ON "document_uploads"("aiProcessingStatus");

-- CreateIndex
CREATE INDEX "document_uploads_uploadType_idx" ON "document_uploads"("uploadType");

-- CreateIndex
CREATE INDEX "user_recommendations_userId_idx" ON "user_recommendations"("userId");

-- CreateIndex
CREATE INDEX "user_recommendations_recommendationType_idx" ON "user_recommendations"("recommendationType");

-- CreateIndex
CREATE INDEX "user_recommendations_nextReviewDate_idx" ON "user_recommendations"("nextReviewDate");

-- CreateIndex
CREATE INDEX "user_interactions_userId_idx" ON "user_interactions"("userId");

-- CreateIndex
CREATE INDEX "user_interactions_itemType_itemId_idx" ON "user_interactions"("itemType", "itemId");

-- CreateIndex
CREATE INDEX "user_interactions_createdAt_idx" ON "user_interactions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "search_index_documentId_key" ON "search_index"("documentId");

-- CreateIndex
CREATE INDEX "search_index_documentType_idx" ON "search_index"("documentType");

-- CreateIndex
CREATE INDEX "search_index_difficulty_idx" ON "search_index"("difficulty");

-- CreateIndex
CREATE INDEX "search_index_isPremium_idx" ON "search_index"("isPremium");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "push_subscriptions_isActive_idx" ON "push_subscriptions"("isActive");

-- CreateIndex
CREATE INDEX "offline_queue_userId_idx" ON "offline_queue"("userId");

-- CreateIndex
CREATE INDEX "offline_queue_status_idx" ON "offline_queue"("status");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_scheduledFor_idx" ON "notifications"("scheduledFor");

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_endDate_idx" ON "subscriptions"("endDate");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_createdAt_idx" ON "payments"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_code_idx" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_isActive_idx" ON "coupons"("isActive");

-- CreateIndex
CREATE INDEX "coupon_redemptions_couponId_idx" ON "coupon_redemptions"("couponId");

-- CreateIndex
CREATE INDEX "coupon_redemptions_userId_idx" ON "coupon_redemptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_challenges_date_key" ON "daily_challenges"("date");

-- CreateIndex
CREATE INDEX "daily_challenges_date_idx" ON "daily_challenges"("date");

-- CreateIndex
CREATE INDEX "daily_challenges_isActive_idx" ON "daily_challenges"("isActive");

-- CreateIndex
CREATE INDEX "challenge_attempts_challengeId_idx" ON "challenge_attempts"("challengeId");

-- CreateIndex
CREATE INDEX "challenge_attempts_userId_idx" ON "challenge_attempts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_attempts_challengeId_userId_key" ON "challenge_attempts"("challengeId", "userId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resourceId_idx" ON "audit_logs"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "error_logs_severity_createdAt_idx" ON "error_logs"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "error_logs_userId_createdAt_idx" ON "error_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "error_logs_resolved_createdAt_idx" ON "error_logs"("resolved", "createdAt");

-- CreateIndex
CREATE INDEX "system_metrics_name_timestamp_idx" ON "system_metrics"("name", "timestamp");

-- CreateIndex
CREATE INDEX "system_metrics_timestamp_idx" ON "system_metrics"("timestamp");

-- CreateIndex
CREATE INDEX "jobs_status_scheduledFor_idx" ON "jobs"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "jobs_queue_status_idx" ON "jobs"("queue", "status");

-- CreateIndex
CREATE INDEX "jobs_type_status_idx" ON "jobs"("type", "status");

-- CreateIndex
CREATE INDEX "jobs_createdAt_idx" ON "jobs"("createdAt");

-- CreateIndex
CREATE INDEX "rate_limit_logs_identifier_endpoint_windowStart_idx" ON "rate_limit_logs"("identifier", "endpoint", "windowStart");

-- CreateIndex
CREATE INDEX "rate_limit_logs_windowEnd_idx" ON "rate_limit_logs"("windowEnd");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_key_idx" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");

-- CreateIndex
CREATE INDEX "api_keys_isActive_expiresAt_idx" ON "api_keys"("isActive", "expiresAt");

-- CreateIndex
CREATE INDEX "security_events_type_createdAt_idx" ON "security_events"("type", "createdAt");

-- CreateIndex
CREATE INDEX "security_events_userId_createdAt_idx" ON "security_events"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "security_events_ipAddress_createdAt_idx" ON "security_events"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "security_events_resolved_idx" ON "security_events"("resolved");

-- CreateIndex
CREATE UNIQUE INDEX "cache_entries_key_key" ON "cache_entries"("key");

-- CreateIndex
CREATE INDEX "cache_entries_expiresAt_idx" ON "cache_entries"("expiresAt");

-- CreateIndex
CREATE INDEX "cache_entries_tags_idx" ON "cache_entries"("tags");

-- CreateIndex
CREATE INDEX "events_processed_createdAt_idx" ON "events"("processed", "createdAt");

-- CreateIndex
CREATE INDEX "events_type_processed_idx" ON "events"("type", "processed");

-- CreateIndex
CREATE INDEX "webhooks_isActive_idx" ON "webhooks"("isActive");

-- CreateIndex
CREATE INDEX "webhook_deliveries_webhookId_status_idx" ON "webhook_deliveries"("webhookId", "status");

-- CreateIndex
CREATE INDEX "webhook_deliveries_eventId_idx" ON "webhook_deliveries"("eventId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_parentQuestionId_fkey" FOREIGN KEY ("parentQuestionId") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_goals" ADD CONSTRAINT "study_goals_studyPlanId_fkey" FOREIGN KEY ("studyPlanId") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_studyPlanId_fkey" FOREIGN KEY ("studyPlanId") REFERENCES "study_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gamification" ADD CONSTRAINT "gamification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_reports" ADD CONSTRAINT "question_reports_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_reports" ADD CONSTRAINT "question_reports_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_categories" ADD CONSTRAINT "user_categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_categories" ADD CONSTRAINT "user_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_recommendations" ADD CONSTRAINT "user_recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_challenges" ADD CONSTRAINT "daily_challenges_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_attempts" ADD CONSTRAINT "challenge_attempts_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "daily_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
