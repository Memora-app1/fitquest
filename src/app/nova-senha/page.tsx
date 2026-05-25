'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react'

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  if (pwd.length === 0) return { score: 0, label: '', color: '' }
  let score = 0
  if (pwd.length >= 6) score++
  if (pwd.length >= 10) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++

  if (score <= 1) return { score: 1, label: 'Fraca', color: '#EF4444' }
  if (score <= 2) return { score: 2, label: 'Razoável', color: '#F5C842' }
  if (score <= 3) return { score: 3, label: 'Boa', color: '#FF4D00' }
  return { score: 4, label: 'Forte', color: '#00FF88' }
}

export default function NovaSenhaPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const strength = getPasswordStrength(password)
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword

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

    setSuccess(true)
    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 2000)
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up">
          <div className="card-glow p-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-brand-green/10 border border-brand-green/30 flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} className="text-brand-green" />
            </div>
            <h1 className="text-2xl font-bold">Senha atualizada!</h1>
            <p className="text-text-secondary">
              Sua nova senha foi salva com sucesso. Redirecionando para o dashboard…
            </p>
            <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-purple/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="heading-display text-3xl gradient-text">⚡ FitQuest</span>
          </Link>
        </div>

        <div className="card-glow p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-purple/10 flex items-center justify-center shrink-0">
              <Lock size={22} className="text-brand-purple" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Nova senha</h1>
              <p className="text-text-secondary text-sm mt-0.5">
                Crie uma senha segura para sua conta FitQuest.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Nova senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input w-full pr-10"
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: strength.score >= bar ? strength.color : '#1E2D45',
                        }}
                      />
                    ))}
                  </div>
                  <div className="text-xs" style={{ color: strength.color }}>
                    {strength.label}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Confirmar nova senha
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`input w-full pr-10 ${
                    !passwordsMatch ? 'border-brand-red/60 focus:border-brand-red' : ''
                  }`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {!passwordsMatch && (
                <p className="text-xs text-brand-red mt-1">As senhas não coincidem</p>
              )}
              {confirmPassword.length > 0 && passwordsMatch && (
                <p className="text-xs text-brand-green mt-1 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Senhas coincidem
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="text-brand-red text-sm bg-brand-red/10 border border-brand-red/20 rounded-xl p-3">
                <p>{error}</p>
                {error.includes('expirado') && (
                  <Link
                    href="/recuperar-senha"
                    className="mt-2 block text-brand-orange underline text-xs"
                  >
                    Solicitar novo link →
                  </Link>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!passwordsMatch && confirmPassword.length > 0)}
              className="btn-primary w-full disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando…
                </>
              ) : (
                'Salvar nova senha →'
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
