-- Patch migration to align production DB with Prisma schema
-- Idempotent: uses IF NOT EXISTS checks

-- 1) Ensure required columns exist on courses
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "thumbnail" TEXT;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "icon" TEXT;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "tags" TEXT[];
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "isFree" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2) Ensure indexes/uniques exist on courses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'courses_slug_key') THEN
        CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'courses_slug_idx') THEN
        CREATE INDEX "courses_slug_idx" ON "courses"("slug");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'courses_isActive_idx') THEN
        CREATE INDEX "courses_isActive_idx" ON "courses"("isActive");
    END IF;
END $$;

-- 3) Ensure categories has courseId column and constraints
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "courseId" TEXT;

DO $$
BEGIN
    -- Indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'categories_courseId_idx') THEN
        CREATE INDEX "categories_courseId_idx" ON "categories"("courseId");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'categories_slug_idx') THEN
        CREATE INDEX "categories_slug_idx" ON "categories"("slug");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'categories_isActive_idx') THEN
        CREATE INDEX "categories_isActive_idx" ON "categories"("isActive");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'categories_courseId_slug_key') THEN
        CREATE UNIQUE INDEX "categories_courseId_slug_key" ON "categories"("courseId", "slug");
    END IF;

    -- Foreign key
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'categories_courseId_fkey'
    ) THEN
        ALTER TABLE "categories"
        ADD CONSTRAINT "categories_courseId_fkey"
        FOREIGN KEY ("courseId") REFERENCES "courses"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
