// Deprecated TestSeries helpers.
// These utilities are kept as no-ops to avoid breaking imports during migration.

export async function getTestSeriesBySlug(_slug: string, _examId: string, _userId?: string) {
  // TestSeries model removed. No replacement in new hierarchy.
  return null
}

export async function getAllTestSeries(_filters?: {
  examCategory?: string
  exam?: string
  isFree?: boolean
  userId?: string
}) {
  // TestSeries model removed. Use Course/Category/Test endpoints instead.
  return [] as any[]
}

export async function checkTestAccess(_userId: string, _testId: string) {
  // Access is controlled per Test (isFree/isPremium) and CourseEnrollment.
  // Callers should use course/category enrollment checks instead.
  return { hasAccess: true as const }
}

export async function updateTestSeriesStats(_seriesId: string) {
  // No-op: TestSeries removed.
  return
}
