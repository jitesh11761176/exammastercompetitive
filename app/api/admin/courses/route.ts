// app/api/admin/courses/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { collection, getDocs, query, orderBy as firestoreOrderBy, getCountFromServer, where } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createCourseSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10).optional(),
  thumbnail: z.string().optional(),
  icon: z.string().optional(),
  tags: z.array(z.string()).default([]),
  order: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  isFree: z.boolean().default(false),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Production-safe auth check - verify session and email presence
    if (!session || !session.user?.email) {
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const db = getFirebaseFirestore();
    if (!db) {
      throw new Error("Firestore not initialized");
    }

    // Get all courses from Firestore
    const coursesRef = collection(db, "courses");
    const coursesQuery = query(coursesRef, firestoreOrderBy("createdAt", "desc"));
    const coursesSnapshot = await getDocs(coursesQuery);

    const data = await Promise.all(coursesSnapshot.docs.map(async (doc) => {
      const courseData = doc.data();
      
      // Count categories for this course
      const categoriesRef = collection(db, "categories");
      const categoriesQuery = query(categoriesRef, where("courseId", "==", doc.id));
      const categoriesSnapshot = await getCountFromServer(categoriesQuery);
      
      return {
        id: doc.id,
        title: courseData.title,
        slug: courseData.slug,
        isActive: courseData.isActive ?? true,
        isFree: courseData.isFree ?? false,
        createdAt: courseData.createdAt,
        _count: {
          categories: categoriesSnapshot.data().count
        }
      };
    }));

    return NextResponse.json({
      success: true,
      data
    }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/admin/courses:", err);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal Server Error", 
        detail: err?.message ?? null 
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Production-safe auth check - verify session and email presence
    if (!session || !session.user?.email) {
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const raw = await req.json().catch(() => ({}));
    const parsed = createCourseSchema.safeParse({
      ...raw,
      // Normalize string inputs from forms
      order: typeof raw.order === "string" ? Number(raw.order) : raw.order,
      isActive:
        typeof raw.isActive === "string"
          ? raw.isActive === "true" || raw.isActive === "on"
          : !!raw.isActive,
      isFree:
        typeof raw.isFree === "string"
          ? raw.isFree === "true" || raw.isFree === "on"
          : !!raw.isFree,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { 
          success: false,
          error: "Validation failed", 
          issues: parsed.error.flatten() 
        },
        { status: 400 }
      );
    }

    const { title, description, thumbnail, icon, tags, order, isActive, isFree } = parsed.data;

    // Log parsed data for debugging
    console.log("Parsed Course Data:", JSON.stringify(parsed.data, null, 2));

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const db = getFirebaseFirestore();
    if (!db) {
      throw new Error("Firestore not initialized");
    }

    // Check if slug already exists
    const coursesRef = collection(db, "courses");
    const existingQuery = query(coursesRef, where("slug", "==", slug));
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { 
          success: false,
          error: "A course with this title already exists" 
        },
        { status: 409 }
      );
    }

    // Create new course
    const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
    const newCourseRef = doc(coursesRef);
    const courseData = {
      title,
      slug,
      description: description || null,
      thumbnail: thumbnail || null,
      icon: icon || null,
      tags,
      order,
      isActive,
      isFree,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(newCourseRef, courseData);

    return NextResponse.json({
      success: true,
      message: "Course created successfully",
      data: {
        id: newCourseRef.id,
        title,
        slug,
        isActive,
        isFree,
        createdAt: new Date().toISOString(),
      }
    }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/admin/courses failed:", {
      message: err?.message,
      name: err?.name,
      stack: err?.stack,
    });
    return NextResponse.json(
      { 
        success: false,
        error: err?.message ?? "Server crash", 
        detail: err?.message ?? null
      },
      { status: 500 }
    );
  }
}
