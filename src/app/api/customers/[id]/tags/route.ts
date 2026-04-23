import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { z } from 'zod'

const addTagSchema = z.object({
  tags: z.array(z.string().min(1)),
})

const removeTagSchema = z.object({
  tags: z.array(z.string().min(1)),
})

/**
 * POST /api/customers/[id]/tags
 * Add tags to customer
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
    const validated = addTagSchema.parse(body)

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

    // Add new tags (avoid duplicates)
    const existingTags = customer.tags || []
    const newTags = Array.from(new Set([...existingTags, ...validated.tags]))

    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: { tags: newTags },
    })

    return NextResponse.json({
      success: true,
      tags: updated.tags,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('[Add Tags] Error:', error)
    return NextResponse.json({ error: 'Failed to add tags' }, { status: 500 })
  }
}

/**
 * DELETE /api/customers/[id]/tags
 * Remove tags from customer
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
    const validated = removeTagSchema.parse(body)

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

    // Remove tags
    const existingTags = customer.tags || []
    const remainingTags = existingTags.filter((tag) => !validated.tags.includes(tag))

    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: { tags: remainingTags },
    })

    return NextResponse.json({
      success: true,
      tags: updated.tags,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('[Remove Tags] Error:', error)
    return NextResponse.json({ error: 'Failed to remove tags' }, { status: 500 })
  }
}
