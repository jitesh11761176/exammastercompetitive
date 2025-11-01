const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanSessions() {
  console.log('Cleaning up sessions...')
  
  // Delete all sessions
  const deleted = await prisma.session.deleteMany({})
  console.log(`Deleted ${deleted.count} sessions`)
  
  await prisma.$disconnect()
}

cleanSessions()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
