# Database Schema Restructuring Plan

## Goal
Simplify from complex multi-level hierarchy to clean: **Course → Category → Test**

## Current Problems
- Too many models: ExamCategory, Exam, TestSeries, Course, Category
- Confusing relationships
- Admin and users see different structures

## New Structure

```
Course (e.g., "DSSSB PRT 2025", "SSC CGL Preparation")
  ├── Category (e.g., "English", "Mathematics", "Reasoning") 
  │     └── Test (individual tests)
  └── Category (e.g., "General Knowledge")
        └── Test (more tests)
```

## Changes Made

### 1. Updated `Course` model
- Removed: examId, lectures, videos, pricing complexity
- Added: direct relation to categories
- Simplified to just: title, description, icon, status

### 2. Updated `Category` model  
- Added: courseId (belongs to a course)
- Changed: slug now unique within course, not globally
- Relation: category.course

### 3. `Test` model
- Already has categoryId
- No changes needed - works with new structure

### 4. Deprecated Models (commented out)
- ExamCategory → replaced by Course
- Exam → not needed
- TestSeries → not needed (tests are directly in categories)
- PYQCollection → can be a category with year tag

## Migration Steps

1. Create new courses from existing data
2. Move categories under courses
3. Tests already linked to categories - no change needed
4. Drop old tables after verification

## Admin Workflow (NEW)

1. **Create Course** → "DSSSB PRT 2025"
2. **Create Categories** in that course → "English", "Math", "GK"
3. **Create Tests** in categories using:
   - AI Generator
   - Manual creation  
   - Bulk upload
   - Excel upload

## User Workflow (NEW)

1. Browse **Courses**
2. Select course → see **Categories**
3. Select category → see **Tests**
4. Attempt tests

## Files to Update

### Admin Pages:
- `/admin/courses` - manage courses
- `/admin/categories` - create categories within course
- `/admin/tests/create` - require course + category
- `/admin/ai-assistant` - require course + category
- `/admin/bulk-upload` - require course + category

### User Pages:
- `/courses` - browse all courses
- `/courses/[id]` - see categories in course
- `/courses/[id]/category/[catId]` - see tests in category
- `/test/[id]` - take test (no change)

### API Routes:
- `/api/admin/courses` - CRUD for courses
- `/api/admin/categories` - require courseId
- All test creation APIs - require course + category
