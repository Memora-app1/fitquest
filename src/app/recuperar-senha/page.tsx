'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/nova-senha` }
    )

    setLoading(false)

    if (resetError) {
      if (resetError.message.includes('rate') || resetError.message.includes('too many')) {
        setError('Muitas tentativas. Aguarde alguns minutos.')
      } else {
        setError('Não foi possível enviar o email. Tente novamente.')
      }
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="card-glow w-full max-w-md p-8 space-y-6 animate-slide-up text-center">
          <div className="text-5xl">📬</div>
          <h1 className="text-2xl font-bold">Email enviado!</h1>
          <p className="text-text-secondary">
            Se <span className="text-white font-medium">{email}</span> tiver uma conta,
            você receberá um link para redefinir sua senha em instantes.
          </p>
          <p className="text-sm text-text-muted">
            Não recebeu? Verifique a pasta de spam ou{' '}
            <button
              onClick={() => setSent(false)}
              className="text-brand-orange underline"
            >
              tente outro email
            </button>
            .
          </p>
          <Link href="/login" className="btn-primary w-full block text-center">
            Voltar ao login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card-glow w-full max-w-md p-8 space-y-6 animate-slide-up">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <span className="heading-display text-4xl gradient-text">⚡ FitQuest</span>
          </Link>
          <h1 className="text-2xl font-bold mt-4">Recuperar senha</h1>
          <p className="text-text-secondary">
            Digite seu email e enviaremos um link para criar uma nova senha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Email da sua conta
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full"
              placeholder="voce@email.com"
              autoComplete="email"
              autoFocus
            />
          </div>

          {error && (
            <div className="text-brand-red text-sm bg-brand-red/10 border border-brand-red/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? 'Enviando…' : 'Enviar link de recuperação →'}
          </button>
        </form>

        <div className="text-center text-sm text-text-secondary">
          <Link href="/login" className="text-brand-orange hover:underline font-medium">
            ← Voltar ao login
          </Link>
        </div>
      </div>
    </main>
  )
}
