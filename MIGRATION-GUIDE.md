# Database Migration Guide: Course Restructuring

## Overview
This migration transitions the database from the complex 4-level hierarchy (ExamCategory → Exam → TestSeries → Test) to a simplified 2-level hierarchy (Course → Category → Test).

## Prerequisites
- ✅ Prisma schema updated and validated
- ✅ Schema validation errors fixed
- ⚠️ **DATABASE_URL must be configured before running migration**

## Migration Steps

### Step 1: Set Up Environment Variables
Create a `.env` file with your database connection:

```bash
# For local development
DATABASE_URL="postgresql://user:password@localhost:5432/exammaster"

# For Vercel/Production (use your actual Neon/Supabase URL)
DATABASE_URL="postgresql://user:password@hostname.neon.tech/database?sslmode=require"
```

### Step 2: Run the Migration

#### Option A: Development Environment (Recommended)
```bash
npx prisma migrate dev --name simplify_to_course_category_test
```

This will:
1. Generate the migration SQL file
2. Apply it to your development database
3. Generate Prisma Client with new types

#### Option B: Production Environment
```bash
# 1. Generate migration without applying
npx prisma migrate dev --create-only --name simplify_to_course_category_test

# 2. Review the generated SQL in: prisma/migrations/[timestamp]_simplify_to_course_category_test/migration.sql

# 3. Apply to production
npx prisma migrate deploy
```

### Step 3: Verify Migration
```bash
# Check migration status
npx prisma migrate status

# Generate Prisma Client
npx prisma generate
```

## Schema Changes Summary

### Added Fields
- `Category.courseId` (String, required) - Links category to parent course
- `Course.reviews` (CourseReview[]) - One-to-many relation

### Removed/Deprecated Models
- ❌ `ExamCategory` - Replaced by `Course`
- ❌ `Exam` - Merged into `Category`
- ❌ `TestSeries` - Simplified into direct Course → Category → Test
- ❌ `PYQCollection` - PYQ tests now regular tests with `pyqYear` field
- ❌ `Lecture` - Video courses deprecated
- ❌ `VideoProgress` - Video courses deprecated
- ❌ `Enrollment` - Using `CourseEnrollment` instead

### Modified Relations
- `Category` now has `courseId` and `course` relation
- `Course` now has `categories[]` relation
- `Test` relations simplified (removed `seriesId`, `pyqCollectionId`)

## Data Migration (if existing data)

⚠️ **IMPORTANT**: If you have existing data in the old models, you need to migrate it before deleting the old models.

### Migration Script Outline
```typescript
// Example migration script (prisma/migrations/data-migration.ts)
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateData() {
  // 1. Migrate ExamCategory → Course
  const examCategories = await prisma.examCategory.findMany()
  for (const examCat of examCategories) {
    await prisma.course.create({
      data: {
        id: examCat.id,
        title: examCat.name,
        slug: examCat.slug,
        description: examCat.description,
        icon: examCat.icon,
        order: examCat.order,
        isActive: examCat.isActive,
        isFree: true // Or based on your logic
      }
    })
  }

  // 2. Migrate Exam → Update Category with courseId
  const exams = await prisma.exam.findMany()
  for (const exam of exams) {
    await prisma.category.updateMany({
      where: { id: exam.categoryId },
      data: { courseId: exam.examCategoryId }
    })
  }

  // 3. Verify all categories have courseId
  const categoriesWithoutCourse = await prisma.category.findMany({
    where: { courseId: null }
  })
  
  if (categoriesWithoutCourse.length > 0) {
    console.warn(`Warning: ${categoriesWithoutCourse.length} categories without courseId`)
    // Handle orphaned categories
  }
}

migrateData()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

## Post-Migration Steps

### 1. Update API Routes
- ✅ `/api/admin/courses` - Updated
- ✅ `/api/admin/courses/[id]` - Updated
- ⏳ `/api/admin/categories` - Update to require courseId
- ⏳ `/api/admin/tests` - Update to work with new hierarchy

### 2. Update Admin Pages
- ✅ `/admin/courses` - Updated to show categories and tests
- ⏳ `/admin/categories` - Update to be nested under courses
- ⏳ `/admin/ai-assistant` - Add course selection
- ⏳ `/admin/bulk-upload` - Add course + category fields

### 3. Create User Pages
- ⏳ `/courses` - Browse all courses
- ⏳ `/courses/[id]` - View categories in a course
- ⏳ `/courses/[id]/category/[catId]` - View tests in a category

### 4. Test End-to-End
- [ ] Create a course
- [ ] Create a category within the course
- [ ] Create a test within the category (AI/Manual/Bulk)
- [ ] Verify user can browse Course → Category → Test
- [ ] Verify test enrollment and attempts work

## Rollback Plan

If migration fails:

```bash
# Rollback the last migration
npx prisma migrate resolve --rolled-back [migration-name]

# Or restore from database backup
```

**Always backup your database before running migrations!**

## Production Deployment (Vercel)

### Before Deployment
1. ✅ Commit all schema changes
2. ✅ Push to GitHub
3. ⚠️ **DO NOT deploy yet** - migration will fail without preparation

### Deployment Steps
1. **Add DATABASE_URL** to Vercel environment variables
2. **Run migration** from Vercel CLI or during build:
   ```bash
   # Option 1: Manual migration before deployment
   vercel env pull .env.local
   npx prisma migrate deploy
   
   # Option 2: Add to build command in vercel.json
   {
     "buildCommand": "npx prisma migrate deploy && npm run build"
   }
   ```
3. **Deploy** to Vercel
4. **Verify** migration status in production

### Post-Deployment Checklist
- [ ] Check Vercel logs for migration success
- [ ] Test admin course creation
- [ ] Test user course browsing
- [ ] Monitor for errors

## Troubleshooting

### Error: "Field courseId is required but not provided"
**Solution**: All categories must have a courseId. Run data migration first.

### Error: "Unique constraint failed on courseId, slug"
**Solution**: Category slugs must be unique within a course. Update duplicate slugs.

### Error: "Foreign key constraint failed"
**Solution**: Ensure all referenced courses exist before creating categories.

### Error: "Cannot reach database server"
**Solution**: Check DATABASE_URL is correct and database is accessible.

## Migration Status

- **Schema Status**: ✅ Valid and formatted
- **Migration File**: ⏳ Pending (needs DATABASE_URL)
- **Database Status**: ⏳ Not applied
- **Code Updates**: 🔄 In progress (Phase 2)

## Next Steps

1. ✅ Configure DATABASE_URL in .env
2. ⏳ Run `npx prisma migrate dev --name simplify_to_course_category_test`
3. ⏳ Complete API route updates
4. ⏳ Update admin pages
5. ⏳ Create user browsing pages
6. ⏳ Test end-to-end workflows
7. ⏳ Deploy to production

---

**Last Updated**: Schema fixed and validated (commit 06e6406)  
**Next Action**: Set DATABASE_URL and run migration
