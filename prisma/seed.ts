import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with demo data...')

  // Clean existing data
  await prisma.tenantUser.deleteMany()
  await prisma.user.deleteMany()
  await prisma.tenant.deleteMany()

  // Create demo user
  const user = await prisma.user.create({
    data: {
      supabaseId: 'auth_demo_user_001',
      email: 'demo@retoquei.com.br',
      fullName: 'Demo User',
    },
  })
  console.log('✓ User created:', user.email)

  // Create demo tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Salão Aurora',
      slug: 'salao-aurora',
      plan: 'GROWTH',
      status: 'ACTIVE',
      ownerId: user.id,
    },
  })
  console.log('✓ Tenant created:', tenant.name)

  // Link user to tenant
  await prisma.tenantUser.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      role: 'OWNER',
    },
  })
  console.log('✓ User linked to tenant')

  // Create dummy services
  const service1 = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: 'Corte de Cabelo',
      category: 'Hair',
      avgPrice: 50,
    },
  })

  const service2 = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: 'Coloração',
      category: 'Hair',
      avgPrice: 150,
    },
  })

  const service3 = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: 'Manicure',
      category: 'Nails',
      avgPrice: 40,
    },
  })
  console.log('✓ Services created')

  // Create dummy professionals
  const prof1 = await prisma.professional.create({
    data: {
      tenantId: tenant.id,
      name: 'Maria Silva',
      email: 'maria@salao.com.br',
      phone: '+5511987654321',
    },
  })

  const prof2 = await prisma.professional.create({
    data: {
      tenantId: tenant.id,
      name: 'João Santos',
      email: 'joao@salao.com.br',
      phone: '+5511987654322',
    },
  })
  console.log('✓ Professionals created')

  // Create demo customers with various lifecycle stages
  const customers = [
    {
      fullName: 'Ana Costa',
      phone: '+5511999999001',
      lifecycleStage: 'RECURRING' as const,
      riskLevel: 'LOW' as const,
    },
    {
      fullName: 'Carla Mendes',
      phone: '+5511999999002',
      lifecycleStage: 'AT_RISK' as const,
      riskLevel: 'HIGH' as const,
    },
    {
      fullName: 'Diana Oliveira',
      phone: '+5511999999003',
      lifecycleStage: 'VIP' as const,
      riskLevel: 'LOW' as const,
    },
    {
      fullName: 'Fernanda Gomes',
      phone: '+5511999999004',
      lifecycleStage: 'LOST' as const,
      riskLevel: 'LOST' as const,
    },
    {
      fullName: 'Gabriela Lima',
      phone: '+5511999999005',
      lifecycleStage: 'ACTIVE' as const,
      riskLevel: 'LOW' as const,
    },
  ]

  for (const cust of customers) {
    const customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        externalId: `cust_${Math.random().toString(36).substr(2, 9)}`,
        fullName: cust.fullName,
        normalizedName: cust.fullName.toLowerCase(),
        phoneE164: cust.phone,
        whatsappOptIn: true,
        lifecycleStage: cust.lifecycleStage,
        riskLevel: cust.riskLevel,
      },
    })

    // Create customer metrics
    await prisma.customerMetrics.create({
      data: {
        customerId: customer.id,
        tenantId: tenant.id,
        totalAppointments: Math.floor(Math.random() * 20) + 1,
        totalSpent: Math.floor(Math.random() * 2000) + 100,
        avgTicket: Math.floor(Math.random() * 150) + 50,
        firstVisitAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        lastVisitAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        avgDaysBetweenVisits: Math.floor(Math.random() * 60) + 10,
        ltv: Math.floor(Math.random() * 1500) + 200,
        repeatVisitRate: Math.random() * 100,
        rfmScore: Math.floor(Math.random() * 100),
      },
    })
  }
  console.log('✓ Customers created')

  // Create demo templates
  const template1 = await prisma.messageTemplate.create({
    data: {
      tenantId: tenant.id,
      name: 'Agradecimento após visita',
      body: 'Oi {{firstName}}! 😊 Obrigada pela visita em {{lastVisitDate}}. Esperamos vê-la em breve!',
      category: 'POST_VISIT',
      isSystem: false,
    },
  })

  const template2 = await prisma.messageTemplate.create({
    data: {
      tenantId: tenant.id,
      name: 'Lembrete de manutenção',
      body: 'Olá {{firstName}}! Sua próxima manutenção está perto. Agende agora: {{salon_name}}',
      category: 'MAINTENANCE',
      isSystem: false,
    },
  })

  const template3 = await prisma.messageTemplate.create({
    data: {
      tenantId: tenant.id,
      name: 'Recuperação de cliente em risco',
      body: 'Sentimos sua falta, {{firstName}}! Que tal voltar para um novo visual? Agende sua próxima sessão!',
      category: 'RECOVERY',
      isSystem: false,
    },
  })
  console.log('✓ Templates created')

  // Create system segments
  const segmentAtRisk = await prisma.segment.create({
    data: {
      tenantId: tenant.id,
      name: 'Clientes em Risco',
      type: 'SYSTEM',
      rulesJson: {
        and: [{ field: 'riskLevel', op: 'in', value: ['MEDIUM', 'HIGH'] }],
      },
      isActive: true,
      customerCount: 2,
    },
  })

  const segmentVIP = await prisma.segment.create({
    data: {
      tenantId: tenant.id,
      name: 'Clientes VIP',
      type: 'SYSTEM',
      rulesJson: {
        and: [{ field: 'lifecycleStage', op: 'eq', value: 'VIP' }],
      },
      isActive: true,
      customerCount: 1,
    },
  })
  console.log('✓ Segments created')

  // Create demo automation flows
  const flow1 = await prisma.automationFlow.create({
    data: {
      tenantId: tenant.id,
      name: 'Agradecimento após visita',
      description: 'Envia mensagem de agradecimento 2 horas após agendamento concluído',
      triggerType: 'AFTER_APPOINTMENT',
      triggerConfig: { delayHours: 2 },
      isActive: true,
      runsCount: 0,
    },
  })

  await prisma.automationFlowStep.create({
    data: {
      flowId: flow1.id,
      stepOrder: 1,
      type: 'DELAY',
      config: { delayMinutes: 120 },
    },
  })

  await prisma.automationFlowStep.create({
    data: {
      flowId: flow1.id,
      stepOrder: 2,
      type: 'SEND_MESSAGE',
      config: { templateId: template1.id },
    },
  })

  const flow2 = await prisma.automationFlow.create({
    data: {
      tenantId: tenant.id,
      name: 'Recuperação de cliente em risco',
      description: 'Envia oferta especial para clientes em risco',
      triggerType: 'SEGMENT_ENTER',
      triggerConfig: { segmentId: segmentAtRisk.id },
      isActive: true,
      runsCount: 0,
    },
  })

  await prisma.automationFlowStep.create({
    data: {
      flowId: flow2.id,
      stepOrder: 1,
      type: 'SEND_MESSAGE',
      config: { templateId: template3.id },
    },
  })

  console.log('✓ Automation flows created')

  // Create a booking connector (CSV stub)
  await prisma.bookingConnector.create({
    data: {
      tenantId: tenant.id,
      type: 'CSV',
      name: 'Importação Manual CSV',
      config: {},
      status: 'CONNECTED',
    },
  })
  console.log('✓ Booking connector created')

  console.log('✅ Database seeded successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
