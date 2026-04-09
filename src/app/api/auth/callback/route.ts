import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Upsert profile record for the authenticated user
      try {
        await prisma.profile.upsert({
          where: { userId: data.user.id },
          update: {
            email: data.user.email ?? null,
            fullName: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
          },
          create: {
            userId: data.user.id,
            email: data.user.email ?? null,
            fullName: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
          },
        })
      } catch (err) {
        console.error('Profile upsert error:', err)
        // Don't block login on profile error
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
