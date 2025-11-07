import { NextResponse, NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-check'
import { setDocument, getDocumentById, getAllDocuments } from '@/lib/firestore-helpers'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: List all users (admin only)
export async function GET() {
  try {
    await requireAdmin()

    // Get all users from Firestore
    const users = await getAllDocuments('users')

    // Transform the data to match the expected format
    const transformedUsers = users.map((user: any) => ({
      id: user.id,
      name: user.name || user.email?.split('@')[0] || 'Unknown',
      email: user.email,
      role: user.role || 'STUDENT',
      createdAt: user.createdAt?.toDate?.() || new Date(user.createdAt),
      testAttempts: user.testAttempts || 0,
      courseReviews: user.courseReviews || 0,
    }))

    return NextResponse.json(transformedUsers)
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch users'
    }, { status: 500 })
  }
}

// POST: Manage user roles (make admin/remove admin)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const { userEmail, action } = await request.json()

    if (!userEmail || !action) {
      return NextResponse.json(
        { error: 'Missing userEmail or action' },
        { status: 400 }
      )
    }

    if (!['make-admin', 'remove-admin'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "make-admin" or "remove-admin"' },
        { status: 400 }
      )
    }

    // Use email as user ID (same as in the script)
    const userId = userEmail

    // Get current user data
    const existingUser = await getDocumentById('users', userId)

    if (action === 'make-admin') {
      if (!existingUser) {
        // Create new user document
        await setDocument('users', userId, {
          email: userEmail,
          role: 'ADMIN',
          createdAt: new Date(),
          updatedAt: new Date(),
          name: userEmail.split('@')[0],
          isActive: true,
        })
      } else {
        // Update existing user
        await setDocument('users', userId, {
          role: 'ADMIN',
          updatedAt: new Date(),
        })
      }

      return NextResponse.json({
        success: true,
        message: `User ${userEmail} is now an ADMIN`
      })
    } else if (action === 'remove-admin') {
      if (!existingUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      await setDocument('users', userId, {
        role: 'STUDENT', // Default role
        updatedAt: new Date(),
      })

      return NextResponse.json({
        success: true,
        message: `User ${userEmail} is now a STUDENT`
      })
    }

    // This should never be reached, but TypeScript requires it
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error managing user role:', error)
    return NextResponse.json(
      { error: 'Failed to manage user role' },
      { status: 500 }
    )
  }
}
