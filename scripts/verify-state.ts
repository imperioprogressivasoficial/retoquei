/**
 * Verifica o estado atual do banco de dados de produção.
 */
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

// Load .env manually
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

const prisma = new PrismaClient()

async function main() {
  console.log('\n=== ESTADO ATUAL DO BANCO ===\n')

  const salon = await prisma.salon.findFirst({ where: { name: 'Império Progressivas' } })
  if (!salon) {
    console.log('ERRO: Salao nao encontrado')
    process.exit(1)
  }

  console.log(`Salao: ${salon.name} (${salon.id})`)

  const [clients, templates, segments, campaigns, messages] = await Promise.all([
    prisma.client.findMany({ where: { salonId: salon.id, deletedAt: null } }),
    prisma.template.findMany({ where: { salonId: salon.id } }),
    prisma.segment.findMany({ where: { salonId: salon.id } }),
    prisma.campaign.findMany({
      where: { salonId: salon.id },
      include: {
        segment: true,
        template: true,
        _count: { select: { recipients: true, messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.message.findMany({
      where: { salonId: salon.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  console.log(`\nClientes:  ${clients.length}`)
  clients.slice(0, 5).forEach((c) => {
    console.log(`  - ${c.fullName} (${c.phone}) [${c.lifecycleStage}]`)
  })

  console.log(`\nTemplates: ${templates.length}`)
  templates.forEach((t) => console.log(`  - ${t.name} [${t.category}]`))

  console.log(`\nSegmentos: ${segments.length}`)
  segments.forEach((s) => console.log(`  - ${s.name} [${s.type}]`))

  console.log(`\nCampanhas: ${campaigns.length}`)
  campaigns.forEach((c) => {
    console.log(
      `  - ${c.name} [${c.status}] segment=${c.segment?.name ?? 'none'} template=${c.template?.name ?? 'none'} recipients=${c._count.recipients} messages=${c._count.messages}`,
    )
  })

  console.log(`\nUltimas mensagens:`)
  messages.forEach((m) => {
    console.log(`  - [${m.status}] ${m.provider} "${m.content.slice(0, 50)}..."`)
  })

  console.log('')
}

main()
  .catch((err) => {
    console.error('ERRO:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
