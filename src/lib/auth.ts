import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function getServerUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getServerSalon() {
  const user = await getServerUser()
  if (!user) return null

  const member = await prisma.salonMember.findFirst({
    where: { userId: user.id },
    include: { salon: true },
    orderBy: { createdAt: 'asc' },
  })

  return member?.salon ?? null
}
