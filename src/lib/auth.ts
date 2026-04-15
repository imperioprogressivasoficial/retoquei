import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export async function getServerUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getServerSalon() {
  try {
    const user = await getServerUser()
    if (!user) return null

    // Primary: find salon via salon_members (multi-tenant aware)
    const member = await prisma.salonMember.findFirst({
      where: { userId: user.id },
      include: { salon: true },
      orderBy: { createdAt: 'asc' },
    })

    if (member?.salon) return member.salon

    // Fallback: find salon where this user is the direct owner
    // (handles users created before salon_members table existed)
    const salon = await prisma.salon.findFirst({
      where: { ownerUserId: user.id },
      orderBy: { createdAt: 'asc' },
    })

    if (salon) {
      // Backfill the missing SalonMember record so this fallback
      // is only needed once
      try {
        await prisma.profile.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id, email: user.email ?? null },
        })
        await prisma.salonMember.upsert({
          where: { salonId_userId: { salonId: salon.id, userId: user.id } },
          update: {},
          create: { salonId: salon.id, userId: user.id, role: 'OWNER' },
        })
      } catch {
        // Non-fatal: member backfill failed, but we still return the salon
      }
    }

    return salon
  } catch (err) {
    console.error('getServerSalon error:', err)
    return null
  }
}
