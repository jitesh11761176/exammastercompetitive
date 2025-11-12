import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  try {
    // PRISMA MIGRATION: This endpoint requires Firebase migration
    return NextResponse.json(
      {
        error: "AI test generation is temporarily disabled. Firebase migration in progress.",
        status: "pending",
      },
      { status: 503 }
    )
  } catch (error) {
    console.error("[AI Generate Test]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
