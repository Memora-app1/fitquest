'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, CheckCircle2, Zap, Trophy, Flame, Target, Shield } from 'lucide-react'

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

const BENEFITS = [
  { icon: <Zap size={16} className="text-brand-gold" />, text: 'XP por hábitos, treinos e tarefas' },
  { icon: <Flame size={16} className="text-brand-orange" />, text: 'Streak diário que te mantém motivado' },
  { icon: <Trophy size={16} className="text-brand-purple" />, text: '8 níveis do Iniciante ao FitQuest Master' },
  { icon: <Target size={16} className="text-brand-green" />, text: 'Coach IA contextualizado no seu progresso' },
  { icon: <Shield size={16} className="text-brand-blue" />, text: 'Finanças e tarefas integradas ao XP' },
]

const MILESTONES = [
  { label: 'Dia 1', desc: '+100 XP bônus de boas-vindas', color: '#F5C842' },
  { label: 'Semana 1', desc: 'Nível 2 — Dedicado', color: '#7C3AED' },
  { label: 'Mês 1', desc: 'Atleta ou acima', color: '#FF4D00' },
  { label: 'Mês 3', desc: 'FitQuest Master 🏆', color: '#00FF88' },
]

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const strength = getPasswordStrength(password)
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword
  const canSubmit = !loading && (confirmPassword.length === 0 || password === confirmPassword)

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
    <main className="min-h-screen flex">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0D1829 0%, #050914 100%)' }}
      >
        {/* Decorative glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-purple/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-orange/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="relative z-10">
          <span className="heading-display text-3xl gradient-text">⚡ FitQuest</span>
        </Link>

        {/* Main content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="heading-display text-4xl leading-tight mb-3">
              Comece sua<br />
              <span className="gradient-text">jornada hoje.</span>
            </h2>
            <p className="text-text-secondary leading-relaxed">
              7 dias grátis para descobrir como a gamificação transforma sua rotina.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            {BENEFITS.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-bg-elevated flex items-center justify-center shrink-0">
                  {b.icon}
                </div>
                <span className="text-sm text-text-secondary">{b.text}</span>
              </div>
            ))}
          </div>

          {/* Milestones */}
          <div className="rounded-2xl border border-border bg-bg-elevated/50 p-4 space-y-3">
            <div className="text-xs text-text-muted uppercase tracking-wider">Sua linha do tempo</div>
            {MILESTONES.map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="text-xs font-bold px-2 py-0.5 rounded-md shrink-0"
                  style={{ backgroundColor: `${m.color}20`, color: m.color }}
                >
                  {m.label}
                </div>
                <span className="text-xs text-text-secondary">{m.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div className="relative z-10 text-xs text-text-muted">
          Sem cartão de crédito para o trial · Cancele a qualquer momento
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Mobile background glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-purple/5 blur-[80px] rounded-full pointer-events-none lg:hidden" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-orange/5 blur-[80px] rounded-full pointer-events-none lg:hidden" />

        <div className="w-full max-w-md relative z-10 animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/">
              <span className="heading-display text-3xl gradient-text">⚡ FitQuest</span>
            </Link>
          </div>

          <div className="card-glow p-8 space-y-5">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Criar conta grátis</h1>
              <p className="text-text-secondary text-sm">7 dias grátis · Sem cartão necessário</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
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
                  autoFocus
                />
              </div>

              {/* Email */}
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

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Senha
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

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Confirmar senha
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
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="btn-primary w-full disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Criando conta…
                  </>
                ) : (
                  'Começar agora — é grátis →'
                )}
              </button>
            </form>

            {/* Login link */}
            <div className="text-center text-sm text-text-secondary">
              Já tem conta?{' '}
              <Link href="/login" className="text-brand-orange hover:underline font-semibold">
                Entrar →
              </Link>
            </div>

            {/* Terms */}
            <p className="text-xs text-text-muted text-center">
              Ao criar conta, você concorda com os{' '}
              <Link href="/termos" className="underline hover:text-text-secondary transition-colors">
                Termos de Uso
              </Link>{' '}
              e a{' '}
              <Link href="/privacidade" className="underline hover:text-text-secondary transition-colors">
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
