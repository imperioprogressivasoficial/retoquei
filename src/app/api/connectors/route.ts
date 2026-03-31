import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createConnectorSchema = z.object({
  type: z.enum(['CSV', 'WEBHOOK', 'TRINKS']),
  name: z.string().min(1).max(100),
  config: z.record(z.unknown()).optional(),
})

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedTenants: { take: 1 } },
  })
  const tenantId = dbUser?.ownedTenants[0]?.tenantId
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const connectors = await prisma.bookingConnector.findMany({
    where: { tenantId },
    include: { syncRuns: { orderBy: { startedAt: 'desc' }, take: 1 } },
  })

  return NextResponse.json({ connectors })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedTenants: { take: 1 } },
  })
  const tenantId = dbUser?.ownedTenants[0]?.tenantId
  if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const body = await req.json()
  const result = createConnectorSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })

  const connector = await prisma.bookingConnector.create({
    data: {
      tenantId,
      type: result.data.type,
      name: result.data.name,
      status: 'CONNECTED',
      config: (result.data.config ?? {}) as object,
    },
  })

  return NextResponse.json(connector, { status: 201 })
}
