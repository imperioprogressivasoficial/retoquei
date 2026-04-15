'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { Eye, EyeOff, Loader2, Mail, Lock, Phone, MessageCircle, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>
type Mode = 'password' | 'otp-phone' | 'otp-code'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<Mode>('password')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // OTP state
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSentMessage, setOtpSentMessage] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setLoading(true)
    setErrorMsg('')
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) {
        if (error.message === 'Invalid login credentials') {
          setErrorMsg('E-mail ou senha incorretos.')
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMsg('Confirme seu e-mail antes de entrar.')
        } else {
          setErrorMsg('Erro ao fazer login. Tente novamente.')
        }
        return
      }
      router.push('/dashboard')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function sendOtp() {
    setErrorMsg('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Erro ao enviar código')
        return
      }
      setOtpSentMessage(data.message ?? 'Código enviado')
      setMode('otp-code')
    } catch {
      setErrorMsg('Erro de rede')
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp() {
    setErrorMsg('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otpCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Código inválido')
        return
      }
      if (data.actionLink) {
        // Navigate to the Supabase magic link — it sets the session then redirects
        window.location.href = data.actionLink
      }
    } catch {
      setErrorMsg('Erro de rede')
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
          <Link href="/" className="mb-4">
            <Image src="/nova-logo-retoquei.svg" alt="Retoquei" width={100} height={100} />
          </Link>
          <h1 className="text-2xl font-bold text-white">Bem-vindo de volta</h1>
          <p className="mt-1 text-sm text-gray-400">Entre na sua conta para continuar</p>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 mb-4">
            {errorMsg}
          </div>
        )}

        {mode === 'password' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">Senha</label>
                <Link href="/forgot-password" className="text-xs text-[#C9A14A] hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 pl-9 pr-9 text-sm focus:outline-none focus:border-[#C9A14A]/50 focus:ring-1 focus:ring-[#C9A14A]/30 transition-colors"
                  autoComplete="current-password"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A14A] text-black font-semibold rounded-lg py-2.5 text-sm hover:bg-[#b8903e] transition-colors disabled:opacity-60 mt-2"
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

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[#0B0B0B] text-gray-500">ou</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMode('otp-phone')
                setErrorMsg('')
              }}
              className="w-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 font-medium rounded-lg py-2.5 text-sm hover:bg-emerald-500/10 transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Entrar com código do WhatsApp
            </button>
          </form>
        )}

        {mode === 'otp-phone' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => { setMode('password'); setErrorMsg('') }}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>

            <div>
              <h2 className="text-white font-semibold mb-1">Receber código por WhatsApp</h2>
              <p className="text-sm text-gray-400">
                Enviaremos um código de 6 dígitos para seu número cadastrado.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">Número com DDD</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={sendOtp}
              disabled={loading || phone.replace(/\D/g, '').length < 10}
              className="w-full bg-[#C9A14A] text-black font-semibold rounded-lg py-2.5 text-sm hover:bg-[#b8903e] transition-colors disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </span>
              ) : (
                'Enviar código'
              )}
            </button>
          </div>
        )}

        {mode === 'otp-code' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => { setMode('otp-phone'); setErrorMsg(''); setOtpCode('') }}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Trocar número
            </button>

            <div>
              <h2 className="text-white font-semibold mb-1">Digite o código</h2>
              <p className="text-sm text-gray-400">{otpSentMessage}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">Código de 6 dígitos</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-3 px-4 text-center text-2xl font-mono tracking-[0.3em] focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
                autoFocus
              />
            </div>

            <button
              type="button"
              onClick={verifyOtp}
              disabled={loading || otpCode.length !== 6}
              className="w-full bg-[#C9A14A] text-black font-semibold rounded-lg py-2.5 text-sm hover:bg-[#b8903e] transition-colors disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>

            <button
              type="button"
              onClick={sendOtp}
              disabled={loading}
              className="w-full text-sm text-gray-400 hover:text-white transition-colors py-2"
            >
              Não recebi — reenviar código
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Não tem uma conta?{' '}
          <Link href="/register" className="text-[#C9A14A] hover:underline font-medium">
            Cadastre-se grátis
          </Link>
        </p>
      </div>
    </div>
  )
}
