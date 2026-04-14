import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const k = t.slice(0, i).trim()
    const v = t.slice(i + 1).trim()
    if (!process.env[k]) process.env[k] = v
  }
}

const prisma = new PrismaClient()

async function main() {
  const authUserId = '891b97a0-0b27-4c36-9bdd-98cf7c4d3cb2'

  const profile = await prisma.profile.upsert({
    where: { userId: authUserId },
    create: { userId: authUserId, email: 'imperio@gmail.com', fullName: 'Admin Império' },
    update: { email: 'imperio@gmail.com' },
  })
  console.log('Profile OK:', profile.id, profile.userId, profile.email)

  const salon = await prisma.salon.findFirst()
  if (salon) {
    const member = await prisma.salonMember.upsert({
      where: { salonId_userId: { salonId: salon.id, userId: authUserId } },
      create: { salonId: salon.id, userId: authUserId, role: 'OWNER' },
      update: { role: 'OWNER' },
    })
    console.log('Linked to salon:', salon.name, '| Role:', member.role)
  } else {
    console.log('No salon found')
  }
}

main()
  .catch((err) => console.error('Error:', err))
  .finally(() => prisma.$disconnect())
