// app/api/health/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Check Firebase connectivity by attempting to get Firestore instance
    const { getFirebaseFirestore } = await import("@/lib/firebase");
    const firestore = getFirebaseFirestore();
    
    if (!firestore) {
      throw new Error("Firestore not initialized");
    }
    
    return NextResponse.json({ ok: true, ts: new Date().toISOString() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "firebase" }, { status: 500 });
  }
}
