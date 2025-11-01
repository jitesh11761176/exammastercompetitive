import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface ExamDB extends DBSchema {
  tests: {
    key: string
    value: {
      id: string
      title: string
      questions: any[]
      duration: number
      cachedAt: number
    }
  }
  attempts: {
    key: string
    value: {
      id: string
      testId: string
      answers: Record<string, any>
      startedAt: number
      lastSaved: number
    }
  }
}

let dbInstance: IDBPDatabase<ExamDB> | null = null

export async function getDB(): Promise<IDBPDatabase<ExamDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<ExamDB>('exam-master-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('tests')) {
        db.createObjectStore('tests', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('attempts')) {
        db.createObjectStore('attempts', { keyPath: 'id' })
      }
    },
  })

  return dbInstance
}

export async function cacheTest(test: any) {
  const db = await getDB()
  await db.put('tests', {
    ...test,
    cachedAt: Date.now(),
  })
}

export async function getCachedTest(testId: string) {
  const db = await getDB()
  const test = await db.get('tests', testId)
  
  // Cache expires after 24 hours
  if (test && Date.now() - test.cachedAt < 24 * 60 * 60 * 1000) {
    return test
  }
  
  return null
}

export async function saveAttemptLocally(attempt: {
  id: string
  testId: string
  answers: Record<string, any>
  startedAt: number
}) {
  const db = await getDB()
  await db.put('attempts', {
    ...attempt,
    lastSaved: Date.now(),
  })
}

export async function getLocalAttempt(attemptId: string) {
  const db = await getDB()
  return await db.get('attempts', attemptId)
}

export async function getAllPendingAttempts() {
  const db = await getDB()
  return await db.getAll('attempts')
}

export async function deletLocalAttempt(attemptId: string) {
  const db = await getDB()
  await db.delete('attempts', attemptId)
}
