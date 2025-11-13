import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: 'Endpoint requires Firebase migration - currently disabled' },
    { status: 503 }
  )
}

