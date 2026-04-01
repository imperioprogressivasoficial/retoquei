import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { createCheckoutSession } from '@/services/stripe.service'
import { z } from 'zod'

const schema = z.object({
  priceId: z.string().min(1),
})

async function getTenantId(supabaseUserId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: supabaseUserId },
    include: { ownedTenants: { take: 1 } },
  })
  return dbUser?.ownedTenants[0]?.tenantId ?? null
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tenantId = await getTenantId(user.id)
    if (!tenantId) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

    const body = await req.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const session = await createCheckoutSession(
      tenantId,
      result.data.priceId,
      `${appUrl}/billing?success=true`,
      `${appUrl}/billing?cancelled=true`,
    )

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[billing/checkout] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
