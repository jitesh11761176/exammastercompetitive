// IndexedDB wrapper for offline test storage and answer synchronization

export interface CachedTest {
  id: string
  title: string
  description: string
  duration: number
  questions: any[]
  cachedAt: number
}

export interface CachedAnswer {
  id?: number
  testId: string
  attemptId: string
  questionId: string
  answer: string | string[]
  markedForReview: boolean
  timeSpent: number
  timestamp: number
  synced: boolean
}

class OfflineStorage {
  private db: IDBDatabase | null = null
  private readonly DB_NAME = 'ExamMasterDB'
  private readonly DB_VERSION = 1

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => reject(request.error)
      
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Tests store for offline access
        if (!db.objectStoreNames.contains('tests')) {
          db.createObjectStore('tests', { keyPath: 'id' })
        }

        // Answers store for auto-save and offline support
        if (!db.objectStoreNames.contains('answers')) {
          const answersStore = db.createObjectStore('answers', {
            keyPath: 'id',
            autoIncrement: true,
          })
          answersStore.createIndex('testId', 'testId', { unique: false })
          answersStore.createIndex('attemptId', 'attemptId', { unique: false })
          answersStore.createIndex('synced', 'synced', { unique: false })
        }

        // Test attempts store
        if (!db.objectStoreNames.contains('attempts')) {
          const attemptsStore = db.createObjectStore('attempts', { keyPath: 'id' })
          attemptsStore.createIndex('testId', 'testId', { unique: false })
          attemptsStore.createIndex('synced', 'synced', { unique: false })
        }
      }
    })
  }

  // Test Management
  async saveTest(test: CachedTest): Promise<void> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tests'], 'readwrite')
      const store = transaction.objectStore('tests')
      const request = store.put({ ...test, cachedAt: Date.now() })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getTest(testId: string): Promise<CachedTest | null> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tests'], 'readonly')
      const store = transaction.objectStore('tests')
      const request = store.get(testId)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteTest(testId: string): Promise<void> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tests'], 'readwrite')
      const store = transaction.objectStore('tests')
      const request = store.delete(testId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getAllCachedTests(): Promise<CachedTest[]> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tests'], 'readonly')
      const store = transaction.objectStore('tests')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  // Answer Management
  async saveAnswer(answer: CachedAnswer): Promise<void> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['answers'], 'readwrite')
      const store = transaction.objectStore('answers')
      const request = store.put({ ...answer, timestamp: Date.now() })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getAnswersByAttempt(attemptId: string): Promise<CachedAnswer[]> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['answers'], 'readonly')
      const store = transaction.objectStore('answers')
      const index = store.index('attemptId')
      const request = index.getAll(attemptId)

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async getUnsyncedAnswers(): Promise<CachedAnswer[]> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['answers'], 'readonly')
      const store = transaction.objectStore('answers')
      const index = store.index('synced')
      const request = index.getAll(false)

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async markAnswersSynced(answerIds: number[]): Promise<void> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['answers'], 'readwrite')
      const store = transaction.objectStore('answers')

      let completed = 0
      answerIds.forEach((id) => {
        const request = store.get(id)
        request.onsuccess = () => {
          const answer = request.result
          if (answer) {
            answer.synced = true
            store.put(answer)
          }
          completed++
          if (completed === answerIds.length) resolve()
        }
      })

      if (answerIds.length === 0) resolve()
    })
  }

  async clearAnswersForAttempt(attemptId: string): Promise<void> {
    const db = await this.init()
    const answers = await this.getAnswersByAttempt(attemptId)
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['answers'], 'readwrite')
      const store = transaction.objectStore('answers')

      let completed = 0
      answers.forEach((answer) => {
        if (answer.id) {
          const request = store.delete(answer.id)
          request.onsuccess = () => {
            completed++
            if (completed === answers.length) resolve()
          }
        }
      })

      if (answers.length === 0) resolve()
    })
  }

  // Sync Management
  async syncAnswers(
    onSync: (answers: CachedAnswer[]) => Promise<void>
  ): Promise<void> {
    const unsyncedAnswers = await this.getUnsyncedAnswers()
    
    if (unsyncedAnswers.length === 0) return

    try {
      await onSync(unsyncedAnswers)
      const answerIds = unsyncedAnswers.map((a) => a.id!).filter(Boolean)
      await this.markAnswersSynced(answerIds)
    } catch (error) {
      console.error('Failed to sync answers:', error)
      throw error
    }
  }

  // Check if IndexedDB is supported
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window
  }

  // Clear all data (for logout/reset)
  async clearAll(): Promise<void> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tests', 'answers', 'attempts'], 'readwrite')
      
      let completed = 0
      const stores = ['tests', 'answers', 'attempts']
      
      stores.forEach((storeName) => {
        const request = transaction.objectStore(storeName).clear()
        request.onsuccess = () => {
          completed++
          if (completed === stores.length) resolve()
        }
      })
    })
  }
}

export const offlineStorage = new OfflineStorage()
