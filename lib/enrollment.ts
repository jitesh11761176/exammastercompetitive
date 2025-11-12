import { getFirebaseFirestore } from './firebase'
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'

// NOTE: This module has been migrated from Prisma to Firebase Firestore
// Manages course enrollments for users

export async function createEnrollment(
  userId: string,
  courseId: string, // Interpreted as courseId
  _paymentId?: string
) {
  const firestore = getFirebaseFirestore()
  if (!firestore) throw new Error('Firestore not initialized')

  // Validate course exists
  const courseRef = doc(firestore, 'courses', courseId)
  const courseSnap = await getDoc(courseRef)
  if (!courseSnap.exists()) {
    throw new Error('Course not found')
  }

  // Create/update enrollment in Firestore
  const enrollmentRef = doc(firestore, 'enrollments', `${userId}_${courseId}`)
  const enrollmentData = {
    userId,
    courseId,
    status: 'ACTIVE',
    enrolledAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
  }
  
  await setDoc(enrollmentRef, enrollmentData, { merge: true })
  return { id: `${userId}_${courseId}`, ...enrollmentData }
}

export async function getUserEnrollments(userId: string, status?: string) {
  const firestore = getFirebaseFirestore()
  if (!firestore) throw new Error('Firestore not initialized')

  const enrollmentsRef = collection(firestore, 'enrollments')
  const constraints = [where('userId', '==', userId)]
  if (status) constraints.push(where('status', '==', status))

  const q = query(enrollmentsRef, ...constraints)
  const snap = await getDocs(q)
  
  const enrollments: any[] = []
  for (const enrollDoc of snap.docs) {
    const enrollData = enrollDoc.data()
    // Fetch course details
    const courseRef = doc(firestore, 'courses', enrollData.courseId)
    const courseSnap = await getDoc(courseRef)
    
    enrollments.push({
      id: enrollDoc.id,
      ...enrollData,
      course: courseSnap.exists() ? { id: courseSnap.id, ...courseSnap.data() } : null
    })
  }

  return enrollments
}

export async function updateEnrollmentProgress(
  userId: string,
  courseId: string,
  _testAttemptId: string
) {
  const firestore = getFirebaseFirestore()
  if (!firestore) throw new Error('Firestore not initialized')

  // Update enrollment with last access time
  const enrollmentRef = doc(firestore, 'enrollments', `${userId}_${courseId}`)
  await setDoc(enrollmentRef, {
    lastAccessedAt: new Date().toISOString()
  }, { merge: true })
}

export async function checkEnrollmentStatus(userId: string, courseId: string) {
  const firestore = getFirebaseFirestore()
  if (!firestore) throw new Error('Firestore not initialized')

  const enrollmentRef = doc(firestore, 'enrollments', `${userId}_${courseId}`)
  const enrollSnap = await getDoc(enrollmentRef)

  if (!enrollSnap.exists()) {
    return { isEnrolled: false, status: null, enrollment: null }
  }

  const enrollmentData: any = enrollSnap.data()
  return {
    isEnrolled: enrollmentData.status === 'ACTIVE',
    status: enrollmentData.status,
    enrollment: { id: enrollSnap.id, ...enrollmentData },
  }
}
