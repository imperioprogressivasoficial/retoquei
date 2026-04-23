import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Segment name is required'),
  description: z.string().optional(),
  customerIds: z.array(z.string()).min(1, 'At least one customer is required'),
})

/**
 * POST /api/segments/bulk
 * Create a segment from a list of selected customers
 */
export async function POST(request: NextRequest) {
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
    const validated = schema.parse(body)

    // Get user's primary tenant
    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        userId: session.user.id,
      },
      include: { tenant: true },
    })

    if (!tenantUser) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 403 })
    }

    // Verify all selected customers belong to tenant
    const customers = await prisma.customer.findMany({
      where: {
        id: { in: validated.customerIds },
        tenantId: tenantUser.tenant.id,
      },
    })

    if (customers.length !== validated.customerIds.length) {
      return NextResponse.json(
        { error: 'Some customers do not belong to your workspace' },
        { status: 400 }
      )
    }

    // Create the segment
    const segment = await prisma.segment.create({
      data: {
        tenantId: tenantUser.tenant.id,
        name: validated.name,
        description: validated.description,
        type: 'CUSTOM',
        rulesJson: {},
        customerCount: customers.length,
        isActive: true,
      },
    })

    // Add customers to segment (membership)
    await prisma.segmentMembership.createMany({
      data: customers.map((customer) => ({
        segmentId: segment.id,
        customerId: customer.id,
        addedAt: new Date(),
      })),
    })

    return NextResponse.json({
      success: true,
      segment: {
        id: segment.id,
        name: segment.name,
        customerCount: customers.length,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('[Bulk Segment] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create segment' },
      { status: 500 }
    )
  }
}
