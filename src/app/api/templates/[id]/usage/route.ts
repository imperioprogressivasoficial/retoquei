import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function getTenantId(supabaseUserId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUserId },
    include: { ownedTenants: { take: 1 } },
  })
  return dbUser?.ownedTenants[0]?.tenantId ?? null
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = await getTenantId(user.id)
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const template = await prisma.messageTemplate.findFirst({
    where: { id: params.id, OR: [{ tenantId }, { isSystem: true }] },
  })
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get usage in campaigns
  const campaignUsage = await prisma.campaign.count({
    where: { tenantId, templateId: params.id },
  })

  // Get usage in flows - search for template ID in step config JSON
  const allFlows = await prisma.automationFlow.findMany({
    where: { tenantId },
    include: {
      steps: {
        where: { type: 'SEND_MESSAGE' },
      },
    },
  })

  const flowsUsingTemplate = allFlows.filter((f) =>
    f.steps.some((step) => {
      const config = step.config as Record<string, unknown>
      return config.templateId === params.id
    })
  )
  const totalFlowStepsWithTemplate = flowsUsingTemplate.reduce(
    (sum, f) => sum + f.steps.filter((s) => (s.config as Record<string, unknown>).templateId === params.id).length,
    0
  )

  // Get message sending stats
  const sentMessages = await prisma.outboundMessage.count({
    where: { tenantId, templateId: params.id },
  })

  const messageStats = await prisma.outboundMessage.groupBy({
    by: ['status'],
    where: { tenantId, templateId: params.id },
    _count: { id: true },
  })

  const statusBreakdown = Object.fromEntries(
    messageStats.map((s) => [s.status, s._count.id])
  )

  return NextResponse.json({
    templateId: params.id,
    usedInCampaigns: campaignUsage,
    usedInFlows: flowsUsingTemplate.length,
    totalFlowSteps: totalFlowStepsWithTemplate,
    messagesSent: sentMessages,
    messageStatusBreakdown: statusBreakdown,
    isActive: campaignUsage > 0 || flowsUsingTemplate.length > 0 || sentMessages > 0,
  })
}
