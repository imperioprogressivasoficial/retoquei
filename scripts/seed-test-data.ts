import { prisma } from '@/lib/prisma'

async function main() {
  console.log('🌱 Seeding test data...')

  // Get first tenant
  const tenant = await prisma.tenant.findFirst()
  if (!tenant) throw new Error('No tenant found. Complete onboarding first.')
  
  console.log(`Using tenant: ${tenant.id}`)

  // 1. Create test customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        name: 'Ana Beatriz',
        phone: '+5511987654321',
        email: 'ana@example.com',
        lifecycleStage: 'AT_RISK',
        lastServiceDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        totalSpent: 450.00,
        visitCount: 8,
        servicePreference: 'Coloração',
      },
    }),
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        name: 'Carla Mendes',
        phone: '+5511987654322',
        email: 'carla@example.com',
        lifecycleStage: 'ACTIVE',
        lastServiceDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        totalSpent: 820.00,
        visitCount: 15,
        servicePreference: 'Escova progressiva',
      },
    }),
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        name: 'Fernanda Silva',
        phone: '+5511987654323',
        email: 'fernanda@example.com',
        lifecycleStage: 'LOST',
        lastServiceDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        totalSpent: 320.00,
        visitCount: 4,
        servicePreference: 'Hidratação',
      },
    }),
    prisma.customer.create({
      data: {
        tenantId: tenant.id,
        name: 'Juliana Rosa',
        phone: '+5511987654324',
        email: 'juliana@example.com',
        lifecycleStage: 'VIP',
        lastServiceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        totalSpent: 3200.00,
        visitCount: 32,
        servicePreference: 'Alongamento de cílios',
      },
    }),
  ])

  console.log(`✓ Created ${customers.length} test customers`)

  // 2. Create test templates
  const templates = await Promise.all([
    prisma.messageTemplate.create({
      data: {
        tenantId: tenant.id,
        name: 'Pós-visita',
        type: 'WHATSAPP',
        content: 'Olá {{firstName}}, obrigada pela sua visita!',
        status: 'ACTIVE',
      },
    }),
    prisma.messageTemplate.create({
      data: {
        tenantId: tenant.id,
        name: 'Resgate',
        type: 'WHATSAPP',
        content: 'Sentimos sua falta! Vem agendar uma sessão? 😊',
        status: 'ACTIVE',
      },
    }),
  ])

  console.log(`✓ Created ${templates.length} test templates`)

  // 3. Create test campaigns
  const campaigns = await Promise.all([
    prisma.campaign.create({
      data: {
        tenantId: tenant.id,
        name: 'Resgate automático',
        status: 'DRAFT',
        messageTemplateId: templates[1].id,
        scheduledAt: new Date(),
      },
    }),
  ])

  console.log(`✓ Created ${campaigns.length} test campaigns`)

  console.log('\n✅ Test data seeded!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
