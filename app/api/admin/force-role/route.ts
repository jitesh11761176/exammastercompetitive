import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { setDocument, getDocumentById } = await import("@/lib/firestore-helpers");
    const email = session.user.email;

    // First check what's in the database
    const existingDoc = await getDocumentById('users', email);
    console.log('[ForceRole] Existing user doc:', existingDoc);

    // Force update the role to ADMIN
    await setDocument('users', email, {
      email: email,
      role: 'ADMIN',
      name: session.user.name || '',
      image: session.user.image || '',
      updatedAt: new Date().toISOString()
    });

    // Verify it was saved
    const updatedDoc = await getDocumentById('users', email);
    console.log('[ForceRole] Updated user doc:', updatedDoc);

    return NextResponse.json({
      success: true,
      message: "Role updated to ADMIN",
      email: email,
      before: existingDoc,
      after: updatedDoc
    });
  } catch (error: any) {
    console.error("Failed to force role:", error);
    return NextResponse.json(
      {
        error: "Failed to force role",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
