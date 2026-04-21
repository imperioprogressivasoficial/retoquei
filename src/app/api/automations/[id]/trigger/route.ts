import { NextResponse } from 'next/server'
import { getServerSalon } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getMessagingProvider } from '@/services/messaging/messaging.factory'

/**
 * Manually trigger an automation to send messages to all active clients
 * POST /api/automations/[id]/trigger
 *
 * Used for testing and on-demand execution of automations
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const salon = await getServerSalon()
    if (!salon) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const automation = await prisma.automation.findFirst({
      where: { id, salonId: salon.id },
      include: { template: true },
    })

    if (!automation) {
      return NextResponse.json({ error: 'Automação não encontrada' }, { status: 404 })
    }

    if (!automation.isActive) {
      return NextResponse.json({ error: 'Automação está desativada' }, { status: 400 })
    }

    if (!automation.template) {
      return NextResponse.json({ error: 'Automação sem template' }, { status: 400 })
    }

    // Get all active clients that opted in to WhatsApp
    const clients = await prisma.client.findMany({
      where: {
        salonId: salon.id,
        deletedAt: null,
        whatsappOptIn: true,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
      },
    })

    if (clients.length === 0) {
      return NextResponse.json({ error: 'Nenhum cliente para enviar' }, { status: 400 })
    }

    const provider = getMessagingProvider()
    let sentCount = 0
    let failedCount = 0

    // Send message to each client
    for (const client of clients) {
      try {
        const firstName = (client.fullName ?? '').split(' ')[0] || 'cliente'
        const content = automation.template.content
          .replace(/\{\{\s*nome\s*\}\}/gi, firstName)
          .replace(/\{\{\s*name\s*\}\}/gi, firstName)
          .replace(/\{\{\s*fullName\s*\}\}/gi, client.fullName ?? 'cliente')

        // Create message record
        const message = await prisma.message.create({
          data: {
            salonId: salon.id,
            clientId: client.id,
            automationId: id,
            templateId: automation.templateId,
            provider: provider.name,
            direction: 'outbound',
            content,
            status: 'PENDING',
          },
        })

        // Send via provider
        const result = await provider.sendTextMessage(client.phone, content)

        if (result.success) {
          await prisma.message.update({
            where: { id: message.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              externalMessageId: result.providerMessageId ?? null,
            },
          })
          sentCount++
        } else {
          await prisma.message.update({
            where: { id: message.id },
            data: {
              status: 'FAILED',
              failedAt: new Date(),
            },
          })
          failedCount++
        }
      } catch (err: any) {
        failedCount++
        console.error(`Failed to send automation to ${client.phone}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      provider: provider.name,
      totalCount: clients.length,
      sentCount,
      failedCount,
      automation: {
        id: automation.id,
        name: automation.name,
        triggerType: automation.triggerType,
      },
    })
  } catch (err: any) {
    console.error('Automation trigger error:', err)
    return NextResponse.json(
      { error: 'Erro ao disparar automação', message: err?.message ?? 'unknown' },
      { status: 500 },
    )
  }
}
