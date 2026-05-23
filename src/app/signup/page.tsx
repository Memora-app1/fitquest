'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function friendlyError(message: string): string {
  if (message.includes('already registered') || message.includes('already been registered')) {
    return 'Este email já tem uma conta. Tente fazer login.'
  }
  if (message.includes('Database error') || message.includes('saving new user')) {
    return 'Erro ao criar perfil. Tente novamente em alguns segundos.'
  }
  if (message.includes('Invalid email')) {
    return 'Email inválido. Verifique o endereço digitado.'
  }
  if (message.includes('Password should be')) {
    return 'A senha precisa ter no mínimo 6 caracteres.'
  }
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Muitas tentativas. Aguarde um minuto e tente novamente.'
  }
  return 'Ocorreu um erro. Tente novamente.'
}

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('A senha precisa ter no mínimo 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name.trim() || email.split('@')[0] },
      },
    })

    if (signUpError) {
      console.error('[signup] error:', signUpError.message, signUpError)
      setError(friendlyError(signUpError.message))
      setLoading(false)
      return
    }

    router.push('/onboarding')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card-glow w-full max-w-md p-8 space-y-6 animate-slide-up">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <span className="heading-display text-4xl gradient-text">⚡ FitQuest</span>
          </Link>
          <h1 className="text-2xl font-bold mt-4">Crie sua conta</h1>
          <p className="text-text-secondary">7 dias grátis · Cancele quando quiser</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Como podemos te chamar?
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
              placeholder="Seu primeiro nome"
              autoComplete="given-name"
            />
          </div>

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
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Senha (mínimo 6 caracteres)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Confirmar senha
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`input w-full ${
                confirmPassword && confirmPassword !== password
                  ? 'border-brand-red/60 focus:border-brand-red'
                  : ''
              }`}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            {confirmPassword && confirmPassword !== password && (
              <p className="text-xs text-brand-red mt-1">As senhas não coincidem</p>
            )}
          </div>

          {error && (
            <div className="text-brand-red text-sm bg-brand-red/10 border border-brand-red/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (confirmPassword.length > 0 && password !== confirmPassword)}
            className="btn-primary w-full disabled:opacity-60"
          >
            {loading ? 'Criando conta…' : 'Começar agora →'}
          </button>
        </form>

        <div className="text-center text-sm text-text-secondary">
          Já tem conta?{' '}
          <Link href="/login" className="text-brand-orange hover:underline font-medium">
            Entrar
          </Link>
        </div>

        <p className="text-xs text-text-muted text-center">
          Ao criar conta, você concorda com nossos{' '}
          <Link href="/termos" className="underline">Termos de Uso</Link> e{' '}
          <Link href="/privacidade" className="underline">Política de Privacidade</Link>.
        </p>
      </div>
    </main>
  )
}
