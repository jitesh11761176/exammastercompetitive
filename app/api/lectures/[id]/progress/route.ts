import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/lectures/[id]/progress - Update video progress
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: lectureId } = params
    const body = await req.json()
    const { watchedSeconds, totalSeconds, lastPosition } = body

    // Get lecture details
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      include: {
        course: true,
      },
    })

    if (!lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      )
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: lecture.courseId,
        },
      },
    })

    if (!enrollment && !lecture.isFree) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 403 }
      )
    }

    // Calculate progress percentage
    const progress = totalSeconds > 0 ? (watchedSeconds / totalSeconds) * 100 : 0
    const isCompleted = progress >= 90 // Consider completed at 90%

    // Check for existing progress
    const existingProgress = await prisma.videoProgress.findUnique({
      where: {
        userId_lectureId: {
          userId: session.user.id,
          lectureId,
        },
      },
    })

    // Upsert video progress
    const videoProgress = await prisma.videoProgress.upsert({
      where: {
        userId_lectureId: {
          userId: session.user.id,
          lectureId,
        },
      },
      update: {
        watchedSeconds,
        totalSeconds,
        progress,
        lastPosition,
        isCompleted,
        lastWatchedAt: new Date(),
        completedAt: isCompleted && !existingProgress?.completedAt ? new Date() : existingProgress?.completedAt,
      },
      create: {
        userId: session.user.id,
        lectureId,
        watchedSeconds,
        totalSeconds,
        progress,
        lastPosition,
        isCompleted,
        lastWatchedAt: new Date(),
        completedAt: isCompleted ? new Date() : null,
      },
    })

    // Update course enrollment progress if enrolled
    if (enrollment) {
      const allProgress = await prisma.videoProgress.findMany({
        where: {
          userId: session.user.id,
          lecture: {
            courseId: lecture.courseId,
          },
        },
      })

      const completedCount = allProgress.filter((p) => p.isCompleted).length
      const totalLectures = lecture.course.totalLectures
      const courseProgress = totalLectures > 0
        ? (completedCount / totalLectures) * 100
        : 0

      await prisma.courseEnrollment.update({
        where: { id: enrollment.id },
        data: {
          progress: courseProgress,
          completedLectures: completedCount,
          lastAccessedAt: new Date(),
          completedAt: courseProgress >= 100 ? new Date() : null,
        },
      })
    }

    return NextResponse.json({
      success: true,
      progress: videoProgress,
    })
  } catch (error) {
    console.error('Error updating video progress:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}

// GET /api/lectures/[id]/progress - Get video progress
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: lectureId } = params

    const progress = await prisma.videoProgress.findUnique({
      where: {
        userId_lectureId: {
          userId: session.user.id,
          lectureId,
        },
      },
    })

    return NextResponse.json({
      progress: progress || null,
    })
  } catch (error) {
    console.error('Error fetching video progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}
