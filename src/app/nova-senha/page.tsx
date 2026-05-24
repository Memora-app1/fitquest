'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NovaSenhaPage() {
  const router = useRouter()
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
    const { error: updateError } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (updateError) {
      if (updateError.message.includes('expired') || updateError.message.includes('invalid')) {
        setError('Link expirado ou inválido. Solicite um novo link de recuperação.')
      } else {
        setError('Não foi possível atualizar a senha. Tente novamente.')
      }
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card-glow w-full max-w-md p-8 space-y-6 animate-slide-up">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <span className="heading-display text-4xl gradient-text">⚡ FitQuest</span>
          </Link>
          <h1 className="text-2xl font-bold mt-4">Nova senha</h1>
          <p className="text-text-secondary">Crie uma nova senha para sua conta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Nova senha (mínimo 6 caracteres)
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
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Confirmar nova senha
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
              <p>{error}</p>
              {error.includes('expirado') && (
                <Link href="/recuperar-senha" className="mt-2 block text-brand-orange underline text-xs">
                  Solicitar novo link →
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (confirmPassword.length > 0 && password !== confirmPassword)}
            className="btn-primary w-full disabled:opacity-60"
          >
            {loading ? 'Salvando…' : 'Salvar nova senha →'}
          </button>
        </form>
      </div>
    </main>
  )
}
