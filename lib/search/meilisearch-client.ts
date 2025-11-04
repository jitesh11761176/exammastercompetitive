import { MeiliSearch } from 'meilisearch'

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY,
})

export const INDEXES = {
  QUESTIONS: 'questions',
  TESTS: 'tests',
}

// Initialize indexes with proper settings
export async function initializeSearchIndexes() {
  try {
    // Questions index
    await client.createIndex(INDEXES.QUESTIONS, { primaryKey: 'id' })
    const questionsIndex = client.index(INDEXES.QUESTIONS)
    
    await questionsIndex.updateSettings({
      searchableAttributes: [
        'content',
        'questionText',
        'tags',
        'topicName',
        'subjectName',
        'categoryName',
      ],
      filterableAttributes: [
        'categoryId',
        'subjectId',
        'topicId',
        'difficulty',
        'questionType',
        'isActive',
      ],
      sortableAttributes: ['createdAt', 'difficulty'],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
      ],
    })

    // Tests index
    await client.createIndex(INDEXES.TESTS, { primaryKey: 'id' })
    const testsIndex = client.index(INDEXES.TESTS)
    
    await testsIndex.updateSettings({
      searchableAttributes: [
        'title',
        'description',
        'tags',
        'categoryName',
      ],
      filterableAttributes: [
        'categoryId',
        'testType',
        'difficulty',
        'isFree',
        'isActive',
      ],
      sortableAttributes: ['createdAt', 'totalQuestions', 'duration'],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
      ],
    })

    console.log('Search indexes initialized successfully')
  } catch (error: any) {
    if (error.code !== 'index_already_exists') {
      console.error('Failed to initialize search indexes:', error)
      throw error
    }
  }
}

// Index a question
export async function indexQuestion(questionData: any) {
  try {
    const index = client.index(INDEXES.QUESTIONS)
    await index.addDocuments([questionData])
  } catch (error) {
    console.error('Failed to index question:', error)
  }
}

// Index multiple questions
export async function indexQuestions(questionsData: any[]) {
  try {
    const index = client.index(INDEXES.QUESTIONS)
    await index.addDocuments(questionsData)
  } catch (error) {
    console.error('Failed to index questions:', error)
  }
}

// Index a test
export async function indexTest(testData: any) {
  try {
    const index = client.index(INDEXES.TESTS)
    await index.addDocuments([testData])
  } catch (error) {
    console.error('Failed to index test:', error)
  }
}

// Search questions
export async function searchQuestions(
  query: string,
  filters?: {
    categoryId?: string
    subjectId?: string
    topicId?: string
    difficulty?: string
    questionType?: string
  },
  limit = 20
) {
  try {
    const index = client.index(INDEXES.QUESTIONS)
    
    const filterStrings = []
    if (filters?.categoryId) filterStrings.push(`categoryId = "${filters.categoryId}"`)
    if (filters?.subjectId) filterStrings.push(`subjectId = "${filters.subjectId}"`)
    if (filters?.topicId) filterStrings.push(`topicId = "${filters.topicId}"`)
    if (filters?.difficulty) filterStrings.push(`difficulty = "${filters.difficulty}"`)
    if (filters?.questionType) filterStrings.push(`questionType = "${filters.questionType}"`)
    filterStrings.push('isActive = true')

    const results = await index.search(query, {
      filter: filterStrings.join(' AND '),
      limit,
      attributesToHighlight: ['questionText', 'content'],
    })

    return results
  } catch (error) {
    console.error('Search questions error:', error)
    return { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 }
  }
}

// Search tests
export async function searchTests(
  query: string,
  filters?: {
    categoryId?: string
    testType?: string
    difficulty?: string
    isFree?: boolean
  },
  limit = 20
) {
  try {
    const index = client.index(INDEXES.TESTS)
    
    const filterStrings = []
    if (filters?.categoryId) filterStrings.push(`categoryId = "${filters.categoryId}"`)
    if (filters?.testType) filterStrings.push(`testType = "${filters.testType}"`)
    if (filters?.difficulty) filterStrings.push(`difficulty = "${filters.difficulty}"`)
    if (filters?.isFree !== undefined) filterStrings.push(`isFree = ${filters.isFree}`)
    filterStrings.push('isActive = true')

    const results = await index.search(query, {
      filter: filterStrings.join(' AND '),
      limit,
      attributesToHighlight: ['title', 'description'],
    })

    return results
  } catch (error) {
    console.error('Search tests error:', error)
    return { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 }
  }
}

// Delete from index
export async function deleteFromIndex(indexName: string, documentId: string) {
  try {
    const index = client.index(indexName)
    await index.deleteDocument(documentId)
  } catch (error) {
    console.error('Failed to delete from index:', error)
  }
}

// Update document in index
export async function updateInIndex(indexName: string, documentData: any) {
  try {
    const index = client.index(indexName)
    await index.updateDocuments([documentData])
  } catch (error) {
    console.error('Failed to update in index:', error)
  }
}

export default client
