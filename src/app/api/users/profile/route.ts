import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { fullName, onboardingComplete } = body

  const metadata: Record<string, unknown> = {}
  if (fullName) metadata.full_name = fullName
  if (onboardingComplete !== undefined) metadata.onboarding_complete = onboardingComplete

  const { error } = await supabase.auth.updateUser({ data: metadata })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
