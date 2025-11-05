import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const count = await prisma.course.count();
    return NextResponse.json({ ok: true, count });
  } catch (e: any) {
    console.error("DB test failed:", e);
    return NextResponse.json({ ok: false, message: e?.message ?? "error" }, { status: 500 });
  }
}
