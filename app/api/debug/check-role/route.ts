import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Dynamically import firestore-helpers
const getFirestoreHelpers = () => import("@/lib/firestore-helpers");

export async function GET() {
  try {
    const firestoreHelpers = await getFirestoreHelpers();
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const userDoc = await firestoreHelpers.getDocumentById('users', userEmail);

    return NextResponse.json({
      sessionRole: (session.user as any).role || "not-set",
      firestoreRole: userDoc?.role || "not-found",
      session,
      firestoreUserDocument: userDoc,
    });
  } catch (error: any) {
    console.error("Failed to check role:", error);
    return NextResponse.json(
      {
        error: "Failed to check role",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
