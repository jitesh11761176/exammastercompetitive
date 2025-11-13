import { NextResponse } from 'next/server'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { 
      status: 'ok',
      message: 'Firebase migration in progress - Prisma health checks disabled',
      firebase: true,
      timestamp: new Date().toISOString()
    }
  )
}

