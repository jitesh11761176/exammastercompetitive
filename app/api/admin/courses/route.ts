// app/api/admin/courses/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

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
    
    console.log('[Courses API] GET - Session:', session?.user?.email, 'Role:', (session?.user as any)?.role);
    
    // Production-safe auth check - verify session and email presence
    if (!session || !session.user?.email) {
      console.error('[Courses API] GET - No session or email');
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized - No session" 
      }, { status: 401 });
    }
    
    // Check if user is admin
    if ((session.user as any)?.role !== 'ADMIN') {
      console.error('[Courses API] GET - Not admin, role:', (session.user as any)?.role);
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized - Admin access required" 
      }, { status: 401 });
    }

    // Use the firestore helpers that handle initialization
    const { getAllDocuments, queryDocuments } = await import("@/lib/firestore-helpers");
    const { where } = await import("firebase/firestore");

    // Get all courses from Firestore
    const courses = await getAllDocuments("courses");

    // Sort by createdAt desc
    const sortedCourses = courses.sort((a: any, b: any) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

    // Count categories for each course
    const data = await Promise.all(sortedCourses.map(async (course: any) => {
      const categories = await queryDocuments("categories", where("courseId", "==", course.id));
      
      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        isActive: course.isActive ?? true,
        isFree: course.isFree ?? false,
        createdAt: course.createdAt,
        _count: {
          categories: categories.length
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
    
    console.log('[Courses API] POST - Session:', session?.user?.email, 'Role:', (session?.user as any)?.role);
    
    // Production-safe auth check - verify session and email presence
    if (!session || !session.user?.email) {
      console.error('[Courses API] POST - No session or email');
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized - No session" 
      }, { status: 401 });
    }
    
    // Check if user is admin
    if ((session.user as any)?.role !== 'ADMIN') {
      console.error('[Courses API] POST - Not admin, role:', (session.user as any)?.role);
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized - Admin access required" 
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

    // Use firestore helpers
    const { queryDocuments, setDocument } = await import("@/lib/firestore-helpers");
    const { where } = await import("firebase/firestore");

    // Check if slug already exists
    const existingCourses = await queryDocuments("courses", where("slug", "==", slug));

    if (existingCourses.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: "A course with this title already exists" 
        },
        { status: 409 }
      );
    }

    // Generate a unique ID for the course
    const courseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new course
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDocument("courses", courseId, courseData);

    return NextResponse.json({
      success: true,
      message: "Course created successfully",
      data: {
        id: courseId,
        ...courseData
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
