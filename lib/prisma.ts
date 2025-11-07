// THIS IS A STUB FILE
// Prisma has been removed from this project in favor of Firebase Firestore
// All database operations should use Firebase Firestore instead
// See lib/firebase.ts for the Firebase configuration

// This stub prevents build errors from old imports
// TODO: Migrate all files importing this to use Firebase Firestore

export const prisma = new Proxy({} as any, {
  get: (_target, prop) => {
    throw new Error(
      `Prisma is no longer configured in this project. ` +
      `Attempted to access: prisma.${String(prop)}. ` +
      `Please use Firebase Firestore instead. See lib/firebase.ts`
    )
  }
})

// Helper: Example of how to migrate from Prisma to Firestore
// 
// BEFORE (Prisma):
// import { prisma } from '@/lib/prisma'
// const user = await prisma.user.findUnique({ where: { id: userId } })
//
// AFTER (Firestore):
// import { firestore } from '@/lib/firebase'
// import { doc, getDoc } from 'firebase/firestore'
// const userDoc = await getDoc(doc(firestore, 'users', userId))
// const user = userDoc.exists() ? userDoc.data() : null
