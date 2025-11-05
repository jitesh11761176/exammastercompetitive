// app/api/admin/courses/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        isActive: true,
        isFree: true,
        createdAt: true,
        _count: { select: { categories: true } },
      },
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/admin/courses:", err);
    return NextResponse.json(
      { error: "Internal Server Error", detail: err?.message ?? null },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, thumbnail, icon, tags, order, isActive, isFree } = parsed.data;

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    // Check if slug already exists
    const existingCourse = await prisma.course.findUnique({
      where: { slug },
    });

    if (existingCourse) {
      return NextResponse.json(
        { error: "A course with this title already exists" },
        { status: 409 }
      );
    }

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description: description || null,
        thumbnail: thumbnail || null,
        icon: icon || null,
        tags,
        order,
        isActive,
        isFree,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        isActive: true,
        isFree: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: course }, { status: 201 });
  } catch (err: any) {
    // Prisma error surface for debugging
    const code = err?.code ?? "";
    console.error("POST /api/admin/courses:", code, err?.message, err);
    return NextResponse.json(
      { error: "Internal Server Error", code, detail: err?.message ?? null },
      { status: 500 }
    );
  }
}
