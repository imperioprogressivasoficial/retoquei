'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Mail, Lock, User, CheckCircle } from 'lucide-react'
import { RetoqueiWordmark } from '@/components/ui/RetoqueiLogo'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z
      .string()
      .min(8, 'Senha deve ter pelo menos 8 caracteres')
      .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
      .regex(/[0-9]/, 'Deve conter pelo menos um número'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

const passwordRules = [
  { label: 'Mínimo 8 caracteres', test: (v: string) => v.length >= 8 },
  { label: 'Uma letra maiúscula', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Um número', test: (v: string) => /[0-9]/.test(v) },
]

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const password = form.watch('password') || ''

  const isDevMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')

  async function onSubmit(data: RegisterForm) {
    setLoading(true)
    try {
      // Dev mode bypass: skip Supabase when using placeholder credentials
      if (isDevMode) {
        await new Promise((r) => setTimeout(r, 600))
        // Set a dev session cookie so the middleware allows access to protected routes
        document.cookie = `dev_user=${encodeURIComponent(JSON.stringify({ id: 'dev-user', email: data.email, user_metadata: { full_name: data.name, has_connector: false } }))};path=/`
        toast.success('Modo dev: conta criada! Redirecionando...')
        router.push('/onboarding/1')
        return
      }

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.name },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })
      if (error) throw error
      toast.success('Conta criada! Redirecionando...')
      router.push('/onboarding/1')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar conta'
      if (message.includes('already registered')) {
        toast.error('Este e-mail já está cadastrado. Faça login.')
      } else {
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C9A14A]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="mb-6">
            <RetoqueiWordmark height={44} />
          </Link>
          <h1 className="text-2xl font-bold">Criar sua conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            14 dias grátis · Sem cartão de crédito
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nome completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                {...form.register('name')}
                type="text"
                placeholder="Seu nome"
                className="input-base pl-9"
                autoComplete="name"
              />
            </div>
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                {...form.register('email')}
                type="email"
                placeholder="seu@email.com"
                className="input-base pl-9"
                autoComplete="email"
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                {...form.register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                className="input-base pl-9 pr-9"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Password strength */}
            {password.length > 0 && (
              <div className="space-y-1 mt-2">
                {passwordRules.map((rule) => (
                  <div key={rule.label} className="flex items-center gap-2">
                    <CheckCircle
                      className={`h-3 w-3 transition-colors ${
                        rule.test(password) ? 'text-emerald-400' : 'text-muted-foreground/40'
                      }`}
                    />
                    <span
                      className={`text-xs transition-colors ${
                        rule.test(password) ? 'text-emerald-400' : 'text-muted-foreground/60'
                      }`}
                    >
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Confirmar senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                {...form.register('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Repita a senha"
                className="input-base pl-9"
                autoComplete="new-password"
              />
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full rounded-lg py-2.5 text-sm font-semibold disabled:opacity-70 mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando conta...
              </span>
            ) : (
              'Criar conta grátis'
            )}
          </button>

          <p className="text-xs text-center text-muted-foreground">
            Ao se cadastrar, você concorda com os{' '}
            <a href="#" className="text-[#C9A14A] hover:underline">Termos de Uso</a>
            {' '}e{' '}
            <a href="#" className="text-[#C9A14A] hover:underline">Política de Privacidade</a>
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-[#C9A14A] hover:underline font-medium">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  )
}
