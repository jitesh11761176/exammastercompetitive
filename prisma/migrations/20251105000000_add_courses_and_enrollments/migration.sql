-- CreateTable courses
CREATE TABLE IF NOT EXISTS "courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "icon" TEXT,
    "tags" TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable categories (if not exists)
CREATE TABLE IF NOT EXISTS "categories" (
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

-- Add courseId column to categories
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "courseId" TEXT;

-- CreateTable course_enrollments
CREATE TABLE IF NOT EXISTS "course_enrollments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" TIMESTAMP(3),
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "courses_slug_key" ON "courses"("slug");
CREATE INDEX IF NOT EXISTS "courses_slug_idx" ON "courses"("slug");
CREATE INDEX IF NOT EXISTS "courses_isActive_idx" ON "courses"("isActive");
CREATE INDEX IF NOT EXISTS "categories_slug_idx" ON "categories"("slug");
CREATE INDEX IF NOT EXISTS "categories_courseId_idx" ON "categories"("courseId");
CREATE UNIQUE INDEX IF NOT EXISTS "categories_courseId_slug_key" ON "categories"("courseId", "slug");
CREATE INDEX IF NOT EXISTS "course_enrollments_userId_idx" ON "course_enrollments"("userId");
CREATE INDEX IF NOT EXISTS "course_enrollments_courseId_idx" ON "course_enrollments"("courseId");
CREATE UNIQUE INDEX IF NOT EXISTS "course_enrollments_userId_courseId_key" ON "course_enrollments"("userId", "courseId");

-- Add foreign keys with check
DO $$
BEGIN
    -- Add categories.courseId FK
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'categories_courseId_fkey'
    ) THEN
        ALTER TABLE "categories" ADD CONSTRAINT "categories_courseId_fkey" 
        FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    -- Add course_enrollments.userId FK
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_enrollments_userId_fkey'
    ) THEN
        ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    -- Add course_enrollments.courseId FK
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_enrollments_courseId_fkey'
    ) THEN
        ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_courseId_fkey" 
        FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
