import { prisma } from '@/lib/prisma'
import { segmentationService } from './segmentation.service'

// ---------------------------------------------------------------------------
// Tenant Service — workspace creation and management
// ---------------------------------------------------------------------------

export async function createTenant(params: {
  name: string
  slug: string
  ownerSupabaseId: string
}) {
  const user = await prisma.user.findUnique({ where: { supabaseId: params.ownerSupabaseId } })
  if (!user) throw new Error('User not found')

  // Ensure slug is unique
  const existingSlug = await prisma.tenant.findUnique({ where: { slug: params.slug } })
  if (existingSlug) throw new Error('Este slug já está em uso')

  const tenant = await prisma.$transaction(async (tx) => {
    const newTenant = await tx.tenant.create({
      data: {
        name: params.name,
        slug: params.slug,
        ownerId: user.id,
      },
    })

    await tx.tenantUser.create({
      data: {
        tenantId: newTenant.id,
        userId: user.id,
        role: 'OWNER',
        joinedAt: new Date(),
      },
    })

    await tx.subscription.create({
      data: {
        tenantId: newTenant.id,
        plan: 'FREE',
        status: 'TRIALING',
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      },
    })

    return newTenant
  })

  // Seed default system segments (fire-and-forget, non-critical)
  segmentationService.seedSystemSegments(tenant.id, prisma).catch((err) =>
    console.error('[Tenant] Failed to seed segments:', err),
  )

  return tenant
}

export async function getTenantForUser(supabaseUserId: string) {
  const user = await prisma.user.findUnique({ where: { supabaseId: supabaseUserId } })
  if (!user) return null

  const membership = await prisma.tenantUser.findFirst({
    where: { userId: user.id },
    include: { tenant: true },
    orderBy: { invitedAt: 'asc' },
  })

  return membership?.tenant ?? null
}

export async function hasActiveConnector(tenantId: string): Promise<boolean> {
  const count = await prisma.bookingConnector.count({
    where: {
      tenantId,
      status: { in: ['CONNECTED', 'SYNCING'] },
    },
  })
  return count > 0
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
}
