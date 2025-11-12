import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint requires Firebase migration and is currently disabled' },
    { status: 503 }
  )
}

export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint requires Firebase migration and is currently disabled' },
    { status: 503 }
  )
}
