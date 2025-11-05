import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Try to query the database
    const result = await prisma.$queryRaw`SELECT current_database(), version()`
    
    // Check if courses table exists
    const tableCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'courses'
      );
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
      coursesTableExists: tableCheck,
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
