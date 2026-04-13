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
  const salonId = '7f3e9e8e-773a-4f51-ab9e-ffc367fda87a'

  const campaigns = await prisma.campaign.findMany({
    where: { salonId },
    include: { segment: true, template: true, _count: { select: { recipients: true } } },
  })

  for (const c of campaigns) {
    console.log(`\n=== Campaign: "${c.name}" ===`)
    console.log(`  status: ${c.status}`)
    console.log(`  canDispatch: ${c.status === 'DRAFT' || c.status === 'SCHEDULED'}`)

    let targetCount = c._count.recipients
    console.log(`  recipients count: ${c._count.recipients}`)

    if (targetCount === 0 && c.segment) {
      const rules = c.segment.rulesJson as any
      console.log(`  segment: "${c.segment.name}" type=${c.segment.type} rules=${JSON.stringify(rules)}`)
      const isDynAll = c.segment.type === 'DYNAMIC' && rules?.all === true
      console.log(`  isDynamic+allRules: ${isDynAll}`)

      if (isDynAll) {
        targetCount = await prisma.client.count({
          where: { salonId, deletedAt: null, whatsappOptIn: true },
        })
        console.log(`  -> client count (optIn=true): ${targetCount}`)
      } else {
        targetCount = await prisma.clientSegment.count({
          where: { segmentId: c.segment.id },
        })
        console.log(`  -> clientSegment count: ${targetCount}`)
      }
    }

    console.log(`  FINAL targetCount: ${targetCount}`)
    console.log(`  BUTTON DISABLED: ${targetCount === 0}`)
    console.log(`  BUTTON VISIBLE: ${c.status === 'DRAFT' || c.status === 'SCHEDULED'}`)
  }

  // Also check all clients optIn status
  const optInTrue = await prisma.client.count({ where: { salonId, deletedAt: null, whatsappOptIn: true } })
  const optInFalse = await prisma.client.count({ where: { salonId, deletedAt: null, whatsappOptIn: false } })
  console.log(`\nClients: optIn=true: ${optInTrue}, optIn=false: ${optInFalse}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
