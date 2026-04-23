import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSalon } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Segment name is required'),
  description: z.string().optional(),
  clientIds: z.array(z.string()).min(1, 'At least one client is required'),
})

/**
 * POST /api/segments/bulk
 * Create a segment from a list of selected clients
 */
export async function POST(request: NextRequest) {
  try {
    const salon = await getServerSalon()
    if (!salon) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Support both clientIds and customerIds for compatibility
    const bodyWithClientIds = {
      ...body,
      clientIds: body.clientIds || body.customerIds,
    }

    const validated = schema.parse(bodyWithClientIds)

    // Verify all selected clients belong to salon
    const clients = await prisma.client.findMany({
      where: {
        id: { in: validated.clientIds },
        salonId: salon.id,
        deletedAt: null,
      },
    })

    if (clients.length !== validated.clientIds.length) {
      return NextResponse.json(
        { error: 'Some clients do not belong to your salon' },
        { status: 400 }
      )
    }

    // Create the segment
    const segment = await prisma.segment.create({
      data: {
        salonId: salon.id,
        name: validated.name,
        description: validated.description,
        type: 'MANUAL',
        rulesJson: {},
      },
    })

    // Add clients to segment
    await prisma.clientSegment.createMany({
      data: clients.map((client) => ({
        salonId: salon.id,
        clientId: client.id,
        segmentId: segment.id,
      })),
    })

    return NextResponse.json({
      success: true,
      segment: {
        id: segment.id,
        name: segment.name,
        customerCount: clients.length,
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
