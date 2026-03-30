import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/app/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure user record exists in DB
      await prisma.user.upsert({
        where: { supabaseId: data.user.id },
        create: {
          supabaseId: data.user.id,
          email: data.user.email!,
          fullName: data.user.user_metadata?.full_name ?? data.user.email!.split('@')[0],
        },
        update: {
          email: data.user.email!,
        },
      })

      // Check if they have a tenant
      const tenant = await prisma.tenantUser.findFirst({
        where: { user: { supabaseId: data.user.id } },
      })

      if (!tenant) {
        return NextResponse.redirect(`${origin}/onboarding/1`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
