import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixDuplicates() {
  try {
    console.log('🔍 Checking for duplicate test attempts...\n')

    // Find duplicates using raw SQL
    const duplicates = await prisma.$queryRaw<
      Array<{ userId: string; testId: string; attemptNumber: number; count: bigint }>
    >`
      SELECT "userId", "testId", "attemptNumber", COUNT(*) as count
      FROM test_attempts
      GROUP BY "userId", "testId", "attemptNumber"
      HAVING COUNT(*) > 1
    `

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found! Database is clean.')
      return
    }

    console.log(`⚠️  Found ${duplicates.length} duplicate combinations:\n`)
    duplicates.forEach((dup) => {
      console.log(
        `   User: ${dup.userId}, Test: ${dup.testId}, Attempt: ${dup.attemptNumber} (${dup.count} records)`
      )
    })

    console.log('\n🔧 Cleaning duplicates...\n')

    let totalDeleted = 0

    // For each duplicate combination, keep the most recent one and delete the rest
    for (const dup of duplicates) {
      // Get all attempts for this combination, ordered by creation time (newest first)
      const attempts = await prisma.testAttempt.findMany({
        where: {
          userId: dup.userId,
          testId: dup.testId,
          attemptNumber: dup.attemptNumber,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      // Keep the first one (most recent), delete the rest
      const toDelete = attempts.slice(1)

      if (toDelete.length > 0) {
        const deleteIds = toDelete.map((a) => a.id)
        const deleted = await prisma.testAttempt.deleteMany({
          where: {
            id: {
              in: deleteIds,
            },
          },
        })

        console.log(
          `   ✓ Kept most recent attempt (${attempts[0].id}), deleted ${deleted.count} older duplicate(s)`
        )
        totalDeleted += deleted.count
      }
    }

    console.log(`\n✅ Successfully cleaned ${totalDeleted} duplicate records!`)
    console.log('\n💡 You can now run: npx prisma db push\n')
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixDuplicates()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
