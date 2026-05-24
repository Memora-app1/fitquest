'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function friendlyError(message: string): string {
  if (message.includes('Invalid login credentials') || message.includes('invalid_credentials')) {
    return 'Email ou senha incorretos. Verifique os dados e tente novamente.'
  }
  if (message.includes('Email not confirmed') || message.includes('email_not_confirmed')) {
    return 'Confirme seu email antes de entrar. Verifique sua caixa de entrada (e o spam).'
  }
  if (message.includes('Too many requests') || message.includes('rate_limit') || message.includes('over_email_send_rate_limit')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  }
  if (message.includes('User not found') || message.includes('user_not_found')) {
    return 'Nenhuma conta encontrada com esse email. Que tal criar uma?'
  }
  if (message.includes('Network') || message.includes('fetch')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.'
  }
  return 'Não foi possível entrar. Tente novamente em alguns instantes.'
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setEmailNotConfirmed(false)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (signInError) {
      const msg = signInError.message
      if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
        setEmailNotConfirmed(true)
      }
      setError(friendlyError(msg))
      setLoading(false)
      return
    }

    router.refresh()
    router.push(redirectTo)
  }

  async function handleResendConfirmation() {
    if (!email) return
    const supabase = createClient()
    await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase() })
    setError('Email de confirmação reenviado! Verifique sua caixa de entrada.')
    setEmailNotConfirmed(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card-glow w-full max-w-md p-8 space-y-6 animate-slide-up">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <span className="heading-display text-4xl gradient-text">⚡ FitQuest</span>
          </Link>
          <h1 className="text-2xl font-bold mt-4">Bem-vindo de volta</h1>
          <p className="text-text-secondary">Entre e continue sua evolução</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full"
              placeholder="voce@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2 flex justify-between">
              <span>Senha</span>
              <Link href="/recuperar-senha" className="text-xs text-brand-orange hover:underline font-normal">
                Esqueci minha senha
              </Link>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-brand-red text-sm bg-brand-red/10 border border-brand-red/20 rounded-lg p-3">
              <p>{error}</p>
              {emailNotConfirmed && email && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  className="mt-2 text-brand-orange underline text-xs"
                >
                  Reenviar email de confirmação
                </button>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? 'Entrando…' : 'Entrar →'}
          </button>
        </form>

        <div className="text-center text-sm text-text-secondary">
          Ainda não tem conta?{' '}
          <Link href="/signup" className="text-brand-orange hover:underline font-medium">
            Criar agora
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  )
}
