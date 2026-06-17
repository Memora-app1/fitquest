'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Flame, Trophy, Zap, Target, CheckCircle2 } from 'lucide-react';

function friendlyError(message: string): string {
  if (message.includes('Invalid login credentials') || message.includes('invalid_credentials')) {
    return 'Email ou senha incorretos. Verifique os dados e tente novamente.';
  }
  if (message.includes('Email not confirmed') || message.includes('email_not_confirmed')) {
    return 'Confirme seu email antes de entrar. Verifique sua caixa de entrada (e o spam).';
  }
  if (
    message.includes('Too many requests') ||
    message.includes('rate_limit') ||
    message.includes('over_email_send_rate_limit')
  ) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }
  if (message.includes('User not found') || message.includes('user_not_found')) {
    return 'Nenhuma conta encontrada com esse email. Que tal criar uma?';
  }
  if (message.includes('Network') || message.includes('fetch')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }
  return 'Não foi possível entrar. Tente novamente em alguns instantes.';
}

const FEATURES = [
  {
    icon: <Zap size={16} className="text-brand-gold" />,
    text: 'Ganhe XP por cada hábito, treino e tarefa',
  },
  {
    icon: <Flame size={16} className="text-brand-orange" />,
    text: 'Mantenha sua sequência diária',
  },
  {
    icon: <Trophy size={16} className="text-brand-purple" />,
    text: 'Suba de nível e desbloqueie conquistas',
  },
  {
    icon: <Target size={16} className="text-brand-green" />,
    text: 'Coach IA personalizado para seu estilo',
  },
];

const LEVEL_PREVIEW = [
  { level: 1, title: 'Iniciante', xp: '0 XP', color: '#8899BB' },
  { level: 3, title: 'Consistente', xp: '1.500 XP', color: '#7C3AED' },
  { level: 5, title: 'Guerreiro', xp: '7.000 XP', color: '#FF4D00' },
  { level: 8, title: 'Master', xp: '35.000 XP', color: '#F5C842' },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Validate redirect to prevent open redirect attacks — only allow same-origin paths
  const rawRedirect = searchParams.get('redirect') ?? '';
  const redirectTo =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/dashboard';
  const callbackError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    callbackError === 'confirmation_failed'
      ? 'Link de confirmação expirado ou inválido. Solicite um novo abaixo.'
      : callbackError === 'missing_code'
        ? 'Link inválido. Tente entrar com seu email e senha.'
        : null
  );
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);

  async function handleGoogleLogin() {
    setOauthLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (oauthError) {
      setError('Erro ao conectar com Google. Tente com email.');
      setOauthLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setEmailNotConfirmed(false);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError) {
      const msg = signInError.message;
      if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
        setEmailNotConfirmed(true);
      }
      setError(friendlyError(msg));
      setLoading(false);
      return;
    }

    // Hard navigation garante que o cookie de sessão seja lido pelo middleware
    window.location.href = redirectTo;
  }

  async function handleResendConfirmation() {
    if (!email) return;
    const supabase = createClient();
    await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase() });
    setError('Email de confirmação reenviado! Verifique sua caixa de entrada.');
    setEmailNotConfirmed(false);
  }

  return (
    <main className="flex min-h-screen">
      {/* Left panel — branding */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex lg:w-[480px] xl:w-[520px]"
        style={{ background: 'linear-gradient(145deg, #0D1829 0%, #050914 100%)' }}
      >
        {/* Decorative glows */}
        <div className="pointer-events-none absolute left-0 top-0 h-80 w-80 rounded-full bg-brand-orange/10 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-brand-purple/10 blur-[100px]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-gold/5 blur-[80px]" />

        {/* Logo */}
        <Link href="/" className="relative z-10">
          <span className="heading-display gradient-text text-3xl">⚡ Ascendia</span>
        </Link>

        {/* Main content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="heading-display mb-3 text-4xl leading-tight">
              Sua evolução
              <br />
              <span className="gradient-text">não para.</span>
            </h2>
            <p className="leading-relaxed text-text-secondary">
              Hábitos, treinos, finanças e produtividade — tudo em um só lugar, gamificado.
            </p>
          </div>

          {/* Features list */}
          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bg-elevated">
                  {f.icon}
                </div>
                <span className="text-sm text-text-secondary">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Level progression preview */}
          <div className="rounded-2xl border border-border bg-bg-elevated/50 p-4">
            <div className="mb-3 text-xs uppercase tracking-wider text-text-muted">
              Progresso de nível
            </div>
            <div className="flex items-center justify-between">
              {LEVEL_PREVIEW.map((lv, i) => (
                <div key={lv.level} className="flex flex-col items-center gap-1.5">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all"
                    style={{
                      borderColor: lv.color,
                      color: lv.color,
                      backgroundColor: `${lv.color}15`,
                    }}
                  >
                    {lv.level}
                  </div>
                  <div className="text-center text-[10px] leading-tight text-text-muted">
                    {lv.title}
                  </div>
                  {i < LEVEL_PREVIEW.length - 1 && (
                    <div className="absolute" style={{ display: 'none' }} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg">
              <div
                className="h-full rounded-full"
                style={{ width: '35%', background: 'linear-gradient(90deg, #7C3AED, #FF4D00)' }}
              />
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-[10px] text-text-muted">Nível 1</span>
              <span className="text-[10px] font-medium text-brand-gold">Nível 8 — Master</span>
            </div>
          </div>
        </div>

        {/* Social proof */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {['🧑', '👩', '👨', '🧑'].map((e, i) => (
              <div
                key={i}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-bg-elevated text-sm"
              >
                {e}
              </div>
            ))}
          </div>
          <div className="text-xs text-text-secondary">
            <span className="font-semibold text-white">+2.400 pessoas</span> já estão evoluindo
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
        {/* Mobile background glow */}
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-brand-orange/5 blur-[80px] lg:hidden" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-brand-purple/5 blur-[80px] lg:hidden" />

        <div className="relative z-10 w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <Link href="/">
              <span className="heading-display gradient-text text-3xl">⚡ Ascendia</span>
            </Link>
          </div>

          <div
            className="relative space-y-6 overflow-hidden rounded-2xl p-8"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,77,0,0.06) 0%, rgba(13,24,41,0.99) 100%)',
              border: '1px solid rgba(255,77,0,0.2)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.4), 0 0 40px rgba(255,77,0,0.06)',
            }}
          >
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,77,0,0.1) 0%, transparent 70%)',
              }}
            />
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
              <p className="text-sm text-text-secondary">Entre e continue sua evolução</p>
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={oauthLoading || loading}
              className="active:scale-98 flex w-full items-center justify-center gap-3 rounded-xl py-3 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
              }}
            >
              {oauthLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                    fill="#4285F4"
                  />
                  <path
                    d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                    fill="#34A853"
                  />
                  <path
                    d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              {oauthLoading ? 'Conectando…' : 'Continuar com Google'}
            </button>

            <div className="flex items-center gap-3 text-xs text-text-muted">
              <div className="h-px flex-1 bg-border" />
              ou
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">Email</label>
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

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-text-secondary">Senha</label>
                  <Link
                    href="/recuperar-senha"
                    className="text-xs text-brand-orange hover:underline"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input w-full pr-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-brand-red/20 bg-brand-red/10 p-3 text-sm text-brand-red">
                  <p>{error}</p>
                  {emailNotConfirmed && email && (
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      className="mt-2 text-xs text-brand-orange underline"
                    >
                      Reenviar email de confirmação
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Entrando…
                  </>
                ) : (
                  'Entrar →'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-text-muted">ou</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Signup CTA */}
            <div className="text-center text-sm text-text-secondary">
              Ainda não tem conta?{' '}
              <Link href="/signup" className="font-semibold text-brand-orange hover:underline">
                Criar conta grátis →
              </Link>
            </div>
          </div>

          {/* Trust signals */}
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <CheckCircle2 size={12} className="text-brand-green" />7 dias grátis
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <CheckCircle2 size={12} className="text-brand-green" />
              Cancele quando quiser
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <CheckCircle2 size={12} className="text-brand-green" />
              100% seguro
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
