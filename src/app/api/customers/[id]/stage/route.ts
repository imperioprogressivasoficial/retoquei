import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { z } from 'zod'

const LIFECYCLE_STAGES = ['NEW', 'ACTIVE', 'RECURRING', 'VIP', 'AT_RISK', 'LOST', 'DORMANT']

const updateStageSchema = z.object({
  lifecycleStage: z.enum(LIFECYCLE_STAGES as [string, ...string[]]),
})

/**
 * PATCH /api/customers/[id]/stage
 * Update customer lifecycle stage
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = updateStageSchema.parse(body)

    // Get user's tenant
    const tenantUser = await prisma.tenantUser.findFirst({
      where: { userId: session.user.id },
      include: { tenant: true },
    })

    if (!tenantUser) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 403 })
    }

    // Verify customer belongs to tenant
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
    })

    if (!customer || customer.tenantId !== tenantUser.tenant.id) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Update lifecycle stage
    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: {
        lifecycleStage: validated.lifecycleStage,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      lifecycleStage: updated.lifecycleStage,
      customer: updated,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('[Update Stage] Error:', error)
    return NextResponse.json({ error: 'Failed to update lifecycle stage' }, { status: 500 })
  }
}

/**
 * GET /api/customers/stages
 * Get available lifecycle stages
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    stages: LIFECYCLE_STAGES.map((stage) => ({
      value: stage,
      label: {
        NEW: 'Novo',
        ACTIVE: 'Ativo',
        RECURRING: 'Recorrente',
        VIP: 'VIP',
        AT_RISK: 'Em Risco',
        LOST: 'Perdido',
        DORMANT: 'Inativo',
      }[stage],
      color: {
        NEW: 'bg-blue-400/15 text-blue-400',
        ACTIVE: 'bg-emerald-400/15 text-emerald-400',
        RECURRING: 'bg-purple-400/15 text-purple-400',
        VIP: 'bg-[#C9A14A]/15 text-[#C9A14A]',
        AT_RISK: 'bg-orange-400/15 text-orange-400',
        LOST: 'bg-red-400/15 text-red-400',
        DORMANT: 'bg-gray-400/15 text-gray-400',
      }[stage],
    })),
  })
}
