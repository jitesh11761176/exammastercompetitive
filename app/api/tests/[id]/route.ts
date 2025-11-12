import { NextResponse } from 'next/server'

// PRISMA MIGRATION: This endpoint requires Firebase migration
// All test endpoints are currently disabled

export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint requires Firebase migration and is currently disabled' },
    { status: 503 }
  )
}

export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint requires Firebase migration and is currently disabled' },
    { status: 503 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'This endpoint requires Firebase migration and is currently disabled' },
    { status: 503 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'This endpoint requires Firebase migration and is currently disabled' },
    { status: 503 }
  )
}
