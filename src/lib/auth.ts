import { createClient } from '@/lib/supabase/server'

export async function getServerUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getServerSalon() {
  const user = await getServerUser()
  if (!user) return null

  // TODO: Fix database connection and restore salon lookup
  // Temporarily return a mock salon to prevent crashes
  return {
    id: 'temp-salon-id',
    ownerUserId: user.id,
    name: 'Meu Salão',
    slug: 'meu-salao',
    phone: null,
    email: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}
