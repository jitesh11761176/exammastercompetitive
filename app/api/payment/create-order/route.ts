import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Endpoint requires Firebase migration - currently disabled' },
    { status: 503 }
  )
}

