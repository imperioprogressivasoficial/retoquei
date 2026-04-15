import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface ClientEventPayload {
  event: 'client.created' | 'client.updated' | 'appointment.completed'
  salonId: string
  clientId: string
}

export async function POST(req: Request) {
  try {
    const body: ClientEventPayload = await req.json()
    const { event, salonId, clientId } = body

    if (!salonId || !clientId) {
      return NextResponse.json(
        { error: 'salonId and clientId required' },
        { status: 400 }
      )
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, salonId },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Find active automations for this salon
    const automations = await prisma.automation.findMany({
      where: { salonId, isActive: true },
      include: { template: true },
    })

    const triggered: string[] = []

    for (const automation of automations) {
      let shouldTrigger = false

      switch (automation.triggerType) {
        case 'POST_VISIT':
          if (event === 'appointment.completed') {
            // For now, trigger immediately (worker should handle delay)
            shouldTrigger = true
          }
          break

        case 'AT_RISK':
          if (client.lifecycleStage === 'AT_RISK') shouldTrigger = true
          break

        case 'WINBACK':
          if (client.lifecycleStage === 'LOST') shouldTrigger = true
          break

        case 'BIRTHDAY':
          if (client.birthDate) {
            const today = new Date()
            const birth = new Date(client.birthDate)
            if (
              birth.getMonth() === today.getMonth() &&
              birth.getDate() === today.getDate()
            ) {
              shouldTrigger = true
            }
          }
          break

        case 'MANUAL_RULE':
          // Evaluate rulesJson if present — currently no-op
          shouldTrigger = false
          break
      }

      if (shouldTrigger && automation.template) {
        // Check if we already sent this automation to this client recently (last 24h)
        const recentMessage = await prisma.message.findFirst({
          where: {
            salonId,
            clientId,
            automationId: automation.id,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        })

        if (recentMessage) continue // Skip duplicate

        // Render template with client name placeholders
        const firstName = (client.fullName ?? '').split(' ')[0] || 'cliente'
        const content = automation.template.content
          .replace(/\{\{\s*nome\s*\}\}/gi, firstName)
          .replace(/\{\{\s*name\s*\}\}/gi, firstName)
          .replace(/\{\{\s*fullName\s*\}\}/gi, client.fullName ?? 'cliente')

        // Create message record
        await prisma.message.create({
          data: {
            salonId,
            clientId,
            automationId: automation.id,
            templateId: automation.templateId,
            provider: 'evolution',
            direction: 'outbound',
            content,
            status: 'PENDING',
          },
        })

        triggered.push(automation.name)
      }
    }

    return NextResponse.json({
      success: true,
      event,
      automationsTriggered: triggered,
      count: triggered.length,
    })
  } catch (err: any) {
    console.error('Client event webhook error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
