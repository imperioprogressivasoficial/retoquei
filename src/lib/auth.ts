import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export async function getServerUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getServerSalon() {
  const user = await getServerUser()
  if (!user) return null

  // Find salon membership for the current user
  const member = await prisma.salonMember.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  })

  if (!member) return null

  const salon = await prisma.salon.findUnique({
    where: { id: member.salonId },
  })

  return salon
}
