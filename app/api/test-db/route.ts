import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Count courses from Firestore
    const { getAllDocuments } = await import("@/lib/firestore-helpers");
    const courses = await getAllDocuments("courses");
    
    return NextResponse.json({ ok: true, count: courses.length });
  } catch (e: any) {
    console.error("DB test failed:", e);
    return NextResponse.json({ ok: false, message: e?.message ?? "error" }, { status: 500 });
  }
}
