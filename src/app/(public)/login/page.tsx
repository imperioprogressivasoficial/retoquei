'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Mail, Lock, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

const magicLinkSchema = z.object({
  email: z.string().email('E-mail inválido'),
})

type LoginForm = z.infer<typeof loginSchema>
type MagicLinkForm = z.infer<typeof magicLinkSchema>

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [magicSent, setMagicSent] = useState(false)

  const passwordForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const magicForm = useForm<MagicLinkForm>({
    resolver: zodResolver(magicLinkSchema),
  })

  const isDevMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')

  async function onPasswordSubmit(data: LoginForm) {
    setLoading(true)
    try {
      if (isDevMode) {
        await new Promise((r) => setTimeout(r, 600))
        document.cookie = `dev_user=${encodeURIComponent(JSON.stringify({ id: 'dev-user', email: data.email, user_metadata: { full_name: 'Dev User', has_connector: true, onboarding_complete: true } }))};path=/`
        toast.success('Modo dev: login realizado!')
        router.push('/dashboard')
        return
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) throw error
      toast.success('Login realizado com sucesso!')
      router.push('/app/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login'
      toast.error(message === 'Invalid login credentials' ? 'E-mail ou senha incorretos' : message)
    } finally {
      setLoading(false)
    }
  }

  async function onMagicLinkSubmit(data: MagicLinkForm) {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })
      if (error) throw error
      setMagicSent(true)
      toast.success('Link enviado! Verifique seu e-mail.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar link'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C9A14A]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gold-gradient shadow-lg shadow-[#C9A14A]/20">
              <span className="text-base font-black text-[#0B0B0B]">R</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Retoquei</span>
          </Link>
          <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entre na sua conta para continuar
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-lg border border-border bg-muted p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode('password')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
              mode === 'password'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Senha
          </button>
          <button
            type="button"
            onClick={() => setMode('magic')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
              mode === 'magic'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Magic Link
          </button>
        </div>

        {/* Password form */}
        {mode === 'password' && (
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  {...passwordForm.register('email')}
                  type="email"
                  placeholder="seu@email.com"
                  className="input-base pl-9"
                  autoComplete="email"
                />
              </div>
              {passwordForm.formState.errors.email && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Senha</label>
                <a href="#" className="text-xs text-[#C9A14A] hover:underline">
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  {...passwordForm.register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-base pl-9 pr-9"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.password && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full rounded-lg py-2.5 text-sm font-semibold disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        )}

        {/* Magic Link form */}
        {mode === 'magic' && (
          <>
            {magicSent ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
                <Sparkles className="mx-auto mb-3 h-8 w-8 text-emerald-400" />
                <h3 className="font-semibold text-foreground mb-1">Link enviado!</h3>
                <p className="text-sm text-muted-foreground">
                  Verifique seu e-mail e clique no link para entrar.
                </p>
                <button
                  onClick={() => setMagicSent(false)}
                  className="mt-4 text-xs text-[#C9A14A] hover:underline"
                >
                  Tentar outro e-mail
                </button>
              </div>
            ) : (
              <form onSubmit={magicForm.handleSubmit(onMagicLinkSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      {...magicForm.register('email')}
                      type="email"
                      placeholder="seu@email.com"
                      className="input-base pl-9"
                    />
                  </div>
                  {magicForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{magicForm.formState.errors.email.message}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Enviaremos um link seguro para seu e-mail. Sem senha necessária.
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full rounded-lg py-2.5 text-sm font-semibold disabled:opacity-70"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </span>
                  ) : (
                    'Enviar Magic Link'
                  )}
                </button>
              </form>
            )}
          </>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Não tem uma conta?{' '}
          <Link href="/register" className="text-[#C9A14A] hover:underline font-medium">
            Cadastre-se grátis
          </Link>
        </p>
      </div>
    </div>
  )
}
