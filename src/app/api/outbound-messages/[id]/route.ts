import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// ---------------------------------------------------------------------------
// GET /api/outbound-messages/[id] — Get message details
// ---------------------------------------------------------------------------
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedTenants: { take: 1 } },
  })
  const tenantId = dbUser?.ownedTenants[0]?.tenantId
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const message = await prisma.outboundMessage.findFirst({
    where: { id, tenantId },
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
          phoneE164: true,
          email: true,
          whatsappOptIn: true,
        },
      },
      template: true,
      campaign: true,
      flow: true,
      events: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!message) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  }

  return NextResponse.json({ message })
}
