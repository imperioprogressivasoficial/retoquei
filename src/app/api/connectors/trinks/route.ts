import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { TrinksConnector } from '@/services/connector/trinks.connector'

/**
 * POST /api/connectors/trinks
 * Create/connect a new Trinks booking system integration
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
    const { apiKey } = body

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key is required' }, { status: 400 })
    }

    // Get user's primary tenant
    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        userId: session.user.id,
        role: { in: ['OWNER', 'MANAGER'] },
      },
      include: { tenant: true },
    })

    if (!tenantUser) {
      return NextResponse.json(
        { error: 'No workspace found or insufficient permissions' },
        { status: 403 }
      )
    }

    // Validate API key by testing connection
    const connector = new TrinksConnector(tenantUser.tenant.id, apiKey)
    const validation = await connector.validateConnection()

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid API Key' },
        { status: 400 }
      )
    }

    // Save connector with encrypted API key
    const bookingConnector = await prisma.bookingConnector.create({
      data: {
        tenantId: tenantUser.tenant.id,
        type: 'TRINKS',
        name: 'Trinks',
        configJson: {
          apiKey, // In production, encrypt this using a secret manager
        },
        status: 'active',
      },
    })

    return NextResponse.json({
      success: true,
      connector: {
        id: bookingConnector.id,
        type: bookingConnector.type,
        name: bookingConnector.name,
        status: bookingConnector.status,
      },
    })
  } catch (error) {
    console.error('[Trinks] Connection error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to connect Trinks' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/connectors/trinks/status
 * Get Trinks connection status
 */
export async function GET(request: NextRequest) {
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

    const tenantUser = await prisma.tenantUser.findFirst({
      where: {
        userId: session.user.id,
      },
      include: { tenant: true },
    })

    if (!tenantUser) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 403 })
    }

    const connector = await prisma.bookingConnector.findFirst({
      where: {
        tenantId: tenantUser.tenant.id,
        type: 'TRINKS',
      },
    })

    if (!connector) {
      return NextResponse.json(
        {
          connected: false,
          message: 'Trinks not connected',
        },
        { status: 200 }
      )
    }

    return NextResponse.json({
      connected: true,
      status: connector.status,
      lastSync: connector.lastSyncAt,
      customersImported: await prisma.customer.count({
        where: {
          tenantId: tenantUser.tenant.id,
          externalId: { startsWith: 'trinks_' },
        },
      }),
    })
  } catch (error) {
    console.error('[Trinks Status] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}
