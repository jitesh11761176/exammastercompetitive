// THIS IS A STUB FILE
// Prisma has been removed from this project in favor of Firebase Firestore
// All database operations should use Firebase Firestore instead
// See lib/firebase.ts for the Firebase configuration

// This stub prevents build errors from old imports
// TODO: Migrate all files importing this to use Firebase Firestore

const prismaError = `
Prisma is no longer configured in this project. 
All data operations should use Firebase Firestore.
See lib/firebase.ts for Firebase configuration and lib/firestore-helpers.ts for helper functions.

Example migration:
  BEFORE (Prisma): import { prisma } from '@/lib/prisma'
  AFTER (Firebase): import { getAllDocuments, getDocumentById } from '@/lib/firestore-helpers'
`

export const prisma = new Proxy({} as any, {
  get: (_target, prop) => {
    // Return mock objects that throw on actual operations
    if (prop === '$connect') return async () => { throw new Error(prismaError) }
    if (prop === '$disconnect') return async () => {}
    
    // Return a mock for collection operations (course, user, etc)
    return new Proxy({} as any, {
      get: () => {
        return new Proxy({} as any, {
          apply: () => { throw new Error(prismaError) },
          get: () => (() => { throw new Error(prismaError) })
        })
      }
    })
  }
})

// Helper: Example of how to migrate from Prisma to Firestore
// 
// BEFORE (Prisma):
// import { prisma } from '@/lib/prisma'
// const user = await prisma.user.findUnique({ where: { id: userId } })
//
// AFTER (Firestore):
// import { getDocumentById } from '@/lib/firestore-helpers'
// const user = await getDocumentById('users', userId)

