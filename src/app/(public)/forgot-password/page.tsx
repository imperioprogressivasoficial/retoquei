'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { Loader2, Mail, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})
type Form = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: Form) {
    setLoading(true)
    setErrorMsg('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: window.location.origin + '/reset-password',
      })
      if (error) {
        setErrorMsg('Erro ao enviar e-mail. Tente novamente.')
        return
      }
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12 bg-[#0B0B0B]">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="mb-4">
            <Image src="/logo-retoquei.png" alt="Retoquei" width={288} height={288} />
          </Link>
          <h1 className="text-2xl font-bold text-white">Recuperar senha</h1>
          <p className="mt-1 text-sm text-gray-400 text-center">
            Digite seu e-mail para receber o link de redefinição
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
            <CheckCircle className="mx-auto mb-3 h-8 w-8 text-emerald-400" />
            <h3 className="font-semibold text-white mb-1">E-mail enviado!</h3>
            <p className="text-sm text-gray-400">
              Verifique sua caixa de entrada e clique no link para redefinir sua senha.
            </p>
            <Link href="/login" className="mt-4 inline-block text-xs text-[#C9A14A] hover:underline">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errorMsg && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-[#C9A14A]/50 focus:ring-1 focus:ring-[#C9A14A]/30 transition-colors"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A14A] text-black font-semibold rounded-lg py-2.5 text-sm hover:bg-[#b8903e] transition-colors disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </span>
              ) : (
                'Enviar link de recuperação'
              )}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Lembrou a senha?{' '}
          <Link href="/login" className="text-[#C9A14A] hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
