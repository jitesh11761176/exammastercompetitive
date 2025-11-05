import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Try to query the database
    const result = await prisma.$queryRaw`SELECT current_database(), version()`
    
    // Check if courses table exists
    const coursesTableCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'courses'
      );
    `

    // Check if categories table exists
    const categoriesTableCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'categories'
      );
    `

    // Check if categories.courseId column exists
    const categoriesCourseIdColumnCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'categories'
        AND column_name = 'courseid'
      );
    `

    // Optionally list columns for categories (first 20)
    const categoriesColumns: any = await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'categories'
      ORDER BY ordinal_position
      LIMIT 50;
    `

    // Try to count courses (will fail if table doesn't exist or columns are wrong)
    let courseCount = null
    let coursesError = null
    try {
      courseCount = await prisma.course.count()
    } catch (e: any) {
      coursesError = e.message
    }

    return NextResponse.json({
      status: 'ok',
      database: result,
      coursesTableExists: coursesTableCheck,
      categoriesTableExists: categoriesTableCheck,
      categoriesCourseIdExists: categoriesCourseIdColumnCheck,
      categoriesColumns,
      courseCount,
      coursesError,
      prismaVersion: '5.22.0',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
