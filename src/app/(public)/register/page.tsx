'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const registerSchema = z
  .object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterForm) {
    setLoading(true)
    setErrorMsg('')
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })
      if (error) {
        if (error.message.includes('already registered')) {
          setErrorMsg('Este e-mail já está cadastrado. Tente fazer login.')
        } else {
          setErrorMsg('Erro ao criar conta. Tente novamente.')
        }
        return
      }
      router.push('/onboarding')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12 bg-[#0B0B0B]">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C9A14A]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="mb-6 text-2xl font-bold text-white">
            Retoquei
          </Link>
          <h1 className="text-2xl font-bold text-white">Crie sua conta</h1>
          <p className="mt-1 text-sm text-gray-400">Grátis para sempre no plano básico</p>
        </div>

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
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-[#C9A14A]/50 focus:ring-1 focus:ring-[#C9A14A]/30 transition-colors"
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-lg py-2.5 pl-9 pr-9 text-sm focus:outline-none focus:border-[#C9A14A]/50 focus:ring-1 focus:ring-[#C9A14A]/30 transition-colors"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white">Confirmar senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                {...register('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Repita a senha"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-[#C9A14A]/50 focus:ring-1 focus:ring-[#C9A14A]/30 transition-colors"
                autoComplete="new-password"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C9A14A] text-black font-semibold rounded-lg py-2.5 text-sm hover:bg-[#b8903e] transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando conta...
              </span>
            ) : (
              'Criar conta'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-[#C9A14A] hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
