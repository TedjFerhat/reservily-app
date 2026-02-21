const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const hashed = await bcrypt.hash('admin123456', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@reservily.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@reservily.com',
      password: hashed,
      role: 'ADMIN',
    },
  })

  console.log('✅ Admin account ready:', admin.email)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})