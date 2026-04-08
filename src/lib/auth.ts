import { createClient } from '@/lib/supabase/server'

export async function getServerUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getServerSalon() {
  const user = await getServerUser()
  if (!user) return null

  // Temporary: return mock salon to prevent database errors
  // TODO: Fix database connection
  return {
    id: 'temp-' + user.id.slice(0, 8),
    ownerUserId: user.id,
    name: 'Meu Salão',
    slug: 'meu-salao',
    phone: null,
    email: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}
