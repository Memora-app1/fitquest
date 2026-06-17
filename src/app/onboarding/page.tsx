'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Check, ChevronRight } from 'lucide-react';

const GOALS = [
  {
    value: 'lose_weight',
    label: 'Perder peso',
    icon: '🔥',
    desc: 'Queimar gordura e emagrecer com saúde',
  },
  {
    value: 'gain_muscle',
    label: 'Ganhar massa',
    icon: '💪',
    desc: 'Hipertrofia, força e volume muscular',
  },
  {
    value: 'consistency',
    label: 'Criar consistência',
    icon: '🎯',
    desc: 'Hábitos diários e sequência imparável',
  },
  { value: 'health', label: 'Mais saúde', icon: '❤️', desc: 'Bem-estar, sono e qualidade de vida' },
  {
    value: 'productivity',
    label: 'Ser mais produtivo',
    icon: '⚡',
    desc: 'Foco, tarefas e resultado no trabalho',
  },
  {
    value: 'finance',
    label: 'Controlar finanças',
    icon: '💰',
    desc: 'Gastos, metas e liberdade financeira',
  },
];

const TARGETS = [
  { value: 3, label: '3x por semana', sub: 'Leve — bom pra começar', emoji: '😊' },
  {
    value: 4,
    label: '4x por semana',
    sub: 'Moderado — o sweet spot',
    emoji: '💪',
    recommended: true,
  },
  { value: 5, label: '5x por semana', sub: 'Intenso — para sérios', emoji: '🔥' },
  { value: 7, label: 'Todo dia', sub: 'Máquina absoluta', emoji: '👑' },
];

const MODULES = [
  {
    value: 'fitness',
    label: 'Fitness & Hábitos',
    icon: '💪',
    desc: 'Treinos, séries, hábitos diários',
    rgb: '255,77,0',
  },
  {
    value: 'productivity',
    label: 'Tarefas',
    icon: '✅',
    desc: 'Kanban + Matriz Eisenhower',
    rgb: '124,58,237',
  },
  {
    value: 'finance',
    label: 'Finanças',
    icon: '💰',
    desc: 'Gastos, receitas e metas',
    rgb: '0,255,136',
  },
  {
    value: 'coach',
    label: 'Coach IA',
    icon: '🤖',
    desc: 'Assistente com contexto total',
    rgb: '245,200,66',
  },
];

const TOTAL_STEPS = 6;

interface FirstHabit {
  id: string;
  name: string;
  icon: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [weeklyTarget, setWeeklyTarget] = useState(4);
  const [loading, setLoading] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [firstHabit, setFirstHabit] = useState<FirstHabit | null>(null);
  const [quickWinLoading, setQuickWinLoading] = useState(false);
  const [quickWinDone, setQuickWinDone] = useState(false);
  const [pushStatus, setPushStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');

  const MAX_GOALS = 3;

  function toggleGoal(value: string) {
    setSelectedGoals((prev) => {
      if (prev.includes(value)) return prev.filter((g) => g !== value);
      if (prev.length >= MAX_GOALS) return prev;
      return [...prev, value];
    });
  }

  async function finishOnboarding() {
    setLoading(true);
    setFinishError(null);

    const suggestedHabits = getSuggestedHabitsMulti(selectedGoals);

    let data: {
      xpEarned?: number;
      leveledUp?: boolean;
      newLevel?: number;
      firstHabit?: FirstHabit;
    } = {};
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_goal: selectedGoals.join(','),
          weekly_target: weeklyTarget,
          habits: suggestedHabits.map((h, i) => ({ ...h, display_order: i })),
        }),
      });

      if (!res.ok) {
        setFinishError('Erro ao configurar perfil. Tente novamente.');
        setLoading(false);
        return;
      }

      data = await res.json();
    } catch {
      setFinishError('Erro de conexão. Verifique sua internet.');
      setLoading(false);
      return;
    }

    if (data.leveledUp && data.newLevel) {
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('ascendia:levelup', { detail: { level: data.newLevel } })
        );
      }, 2500);
    }

    if (data.firstHabit) {
      setFirstHabit(data.firstHabit);
      setLoading(false);
      setStep(5); // quick-win step
    } else {
      router.push('/dashboard?welcome=1');
      router.refresh();
    }
  }

  async function handleQuickWin() {
    if (!firstHabit || quickWinLoading) return;
    setQuickWinLoading(true);
    try {
      await fetch('/api/habits/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId: firstHabit.id }),
      });
    } catch {
      /* silencioso — não bloquear o fluxo */
    }

    setQuickWinDone(true);
    if (navigator.vibrate) navigator.vibrate([30, 20, 80, 20, 120]);

    // Em vez de redirecionar direto, vai para o step de push opt-in
    setTimeout(() => setStep(6), 1200);
  }

  async function handleEnablePush() {
    setPushStatus('loading');
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      const json = sub.toJSON();
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      setPushStatus('granted');
      if (navigator.vibrate) navigator.vibrate([20, 10, 40]);
      setTimeout(goToDashboard, 1200);
    } catch {
      setPushStatus('denied');
    }
  }

  function goToDashboard() {
    router.push('/dashboard?welcome=1');
    router.refresh();
  }

  function skipToDashboard() {
    goToDashboard();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-brand-orange/8 absolute left-1/2 top-1/4 h-[300px] w-[500px] -translate-x-1/2 rounded-full blur-[120px]" />
        <div className="bg-brand-purple/8 absolute bottom-1/4 left-1/4 h-[200px] w-[300px] rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Progress bar */}
        {step > 1 && (
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-text-muted">
                Passo {step - 1} de {TOTAL_STEPS - 1}
              </span>
              <span className="text-xs text-text-muted">
                {Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100)}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-bg-elevated">
              <div
                className="h-full rounded-full bg-gradient-brand transition-all duration-500"
                style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div
          className="relative animate-fade-in space-y-6 overflow-hidden rounded-2xl p-6 md:p-8"
          style={{
            background: 'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.99) 100%)',
            border: '1px solid rgba(255,77,0,0.2)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,77,0,0.1) 0%, transparent 70%)',
            }}
          />
          {/* ── Step 1: Welcome ── */}
          {step === 1 && (
            <div className="space-y-6 text-center">
              <div className="text-6xl">⚡</div>
              <div>
                <h1 className="heading-display gradient-text mb-3 text-4xl">
                  Bem-vindo ao Ascendia
                </h1>
                <p className="leading-relaxed text-text-secondary">
                  O único app que gamifica sua academia, tarefas e finanças ao mesmo tempo. Cada
                  ação vira XP. Cada dia vira evolução.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {MODULES.map((m) => (
                  <div
                    key={m.value}
                    className="rounded-xl p-3 text-left"
                    style={{
                      background: `rgba(${m.rgb},0.06)`,
                      border: `1px solid rgba(${m.rgb},0.2)`,
                    }}
                  >
                    <div className="mb-1 text-2xl">{m.icon}</div>
                    <div className="text-sm font-semibold">{m.label}</div>
                    <div className="mt-0.5 text-xs text-text-muted">{m.desc}</div>
                  </div>
                ))}
              </div>

              {/* Social proof */}
              <div
                className="flex items-center justify-center gap-4 rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex -space-x-2">
                  {['🧑', '👩', '🧔', '👩‍🦱'].map((emoji, i) => (
                    <div
                      key={i}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm"
                      style={{ background: '#0D1829', borderColor: '#050914' }}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold">+12.400 usuários ativos</div>
                  <div className="text-xs text-text-muted">construindo hábitos hoje</div>
                </div>
              </div>

              <div className="space-y-3">
                <button onClick={() => setStep(2)} className="btn-primary w-full py-4 text-lg">
                  Vamos começar <ChevronRight size={18} className="inline" />
                </button>
                <p className="text-xs text-text-muted">Configuração rápida · menos de 1 minuto</p>
              </div>
            </div>
          )}

          {/* ── Step 2: Goals (multi-select, max 3) ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="mb-1 text-2xl font-bold">Quais seus objetivos?</h2>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-secondary">
                    Vamos personalizar sua experiência com hábitos sugeridos.
                  </p>
                  <span
                    className={cn(
                      'ml-3 shrink-0 rounded-full px-2.5 py-1 text-xs font-bold transition-all',
                      selectedGoals.length === MAX_GOALS
                        ? 'border border-brand-orange/40 bg-brand-orange/20 text-brand-orange'
                        : 'border border-border bg-bg-elevated text-text-muted'
                    )}
                  >
                    {selectedGoals.length}/{MAX_GOALS}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {GOALS.map((g) => {
                  const isSelected = selectedGoals.includes(g.value);
                  const isDisabled = !isSelected && selectedGoals.length >= MAX_GOALS;
                  return (
                    <button
                      key={g.value}
                      onClick={() => toggleGoal(g.value)}
                      disabled={isDisabled}
                      className={cn(
                        'flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all',
                        isSelected
                          ? 'border-brand-orange bg-brand-orange/10'
                          : isDisabled
                            ? 'cursor-not-allowed border-border bg-bg-elevated opacity-35'
                            : 'border-border bg-bg-elevated hover:border-brand-orange/40'
                      )}
                    >
                      <span className="shrink-0 text-2xl">{g.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold">{g.label}</div>
                        <div className="text-xs text-text-muted">{g.desc}</div>
                      </div>
                      <div
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all',
                          isSelected
                            ? 'border-brand-orange bg-brand-orange'
                            : 'border-border bg-transparent'
                        )}
                      >
                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedGoals.length === MAX_GOALS && (
                <p className="text-center text-xs text-brand-orange">
                  Máximo de {MAX_GOALS} objetivos atingido. Desmarque um para trocar.
                </p>
              )}

              <button
                onClick={() => setStep(3)}
                disabled={selectedGoals.length === 0}
                className="btn-primary w-full disabled:opacity-40"
              >
                Próximo →
              </button>
            </div>
          )}

          {/* ── Step 3: Weekly Target ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="mb-1 text-2xl font-bold">Quantos dias por semana?</h2>
                <p className="text-sm text-text-secondary">
                  Seja realista. Consistência bate intensidade — você pode ajustar depois.
                </p>
              </div>

              <div className="space-y-2">
                {TARGETS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setWeeklyTarget(t.value)}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all',
                      weeklyTarget === t.value
                        ? 'border-brand-orange bg-brand-orange/10'
                        : 'border-border bg-bg-elevated hover:border-brand-orange/40'
                    )}
                  >
                    <span className="shrink-0 text-2xl">{t.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{t.label}</span>
                        {t.recommended && (
                          <span className="rounded-full bg-brand-orange/20 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-orange">
                            Recomendado
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-muted">{t.sub}</div>
                    </div>
                    {weeklyTarget === t.value && (
                      <Check size={18} className="shrink-0 text-brand-orange" />
                    )}
                  </button>
                ))}
              </div>

              {/* Visual week preview */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="mb-2 text-xs text-text-muted">Sua semana vai parecer assim:</div>
                <div className="flex gap-1.5">
                  {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, i) => {
                    const isActive = i < weeklyTarget;
                    return (
                      <div key={i} className="flex-1 text-center">
                        <div
                          className={cn(
                            'mb-1 h-8 rounded-lg transition-all',
                            isActive ? 'bg-brand-orange/40' : 'bg-bg-elevated'
                          )}
                        />
                        <span
                          className={cn(
                            'text-[10px]',
                            isActive ? 'text-brand-orange' : 'text-text-muted'
                          )}
                        >
                          {day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-ghost flex-1">
                  Voltar
                </button>
                <button onClick={() => setStep(4)} className="btn-primary flex-1">
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Confirmation ── */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mb-3 text-5xl">🚀</div>
                <h2 className="mb-2 text-2xl font-bold">Tudo pronto!</h2>
                <p className="text-sm text-text-secondary">
                  Configuramos seu perfil e criamos hábitos iniciais baseados no seu objetivo.
                </p>
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <div className="flex items-start gap-3 rounded-xl bg-bg-elevated p-3">
                  <span className="mt-0.5 text-xl">🎯</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 text-xs text-text-muted">
                      {selectedGoals.length === 1
                        ? 'Objetivo'
                        : `${selectedGoals.length} objetivos`}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedGoals.map((gv) => {
                        const g = GOALS.find((x) => x.value === gv);
                        return g ? (
                          <span
                            key={gv}
                            className="flex items-center gap-1 rounded-lg border border-brand-orange/25 bg-brand-orange/10 px-2 py-0.5 text-sm font-medium text-brand-orange"
                          >
                            {g.icon} {g.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-bg-elevated p-3">
                  <span className="text-xl">
                    {TARGETS.find((t) => t.value === weeklyTarget)?.emoji}
                  </span>
                  <div>
                    <div className="text-xs text-text-muted">Meta semanal</div>
                    <div className="font-medium">
                      {TARGETS.find((t) => t.value === weeklyTarget)?.label}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-bg-elevated p-3">
                  <span className="text-xl">🌱</span>
                  <div>
                    <div className="text-xs text-text-muted">Hábitos criados</div>
                    <div className="font-medium">
                      {getSuggestedHabitsMulti(selectedGoals).length} hábito(s) personalizado(s)
                    </div>
                  </div>
                </div>
              </div>

              {/* Personalized XP projection */}
              {(() => {
                const habitsCount = getSuggestedHabitsMulti(selectedGoals).length;
                const weeklyXp = habitsCount * 50 * weeklyTarget; // base XP
                const monthlyXp = weeklyXp * 4 + 100; // +100 onboarding bonus
                const daysToLevel2 = Math.ceil((500 - 100) / (weeklyXp / 7));
                return (
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(13,24,41,0.95) 100%)',
                      border: '1px solid rgba(124,58,237,0.3)',
                    }}
                  >
                    <div className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#9F5AF7' }}>
                      🔮 Sua projeção personalizada
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-xl font-black text-brand-gold">+{weeklyXp}</div>
                        <div className="text-[10px] text-text-muted">XP/semana</div>
                      </div>
                      <div>
                        <div className="text-xl font-black text-brand-gold">+{monthlyXp}</div>
                        <div className="text-[10px] text-text-muted">XP/mês</div>
                      </div>
                      <div>
                        <div className="text-xl font-black" style={{ color: '#9F5AF7' }}>
                          {daysToLevel2}d
                        </div>
                        <div className="text-[10px] text-text-muted">até Nível 2</div>
                      </div>
                    </div>
                    <p className="mt-2 text-center text-[11px] text-text-muted">
                      Se você completar {habitsCount} hábito{habitsCount !== 1 ? 's' : ''} por {weeklyTarget}x/semana
                    </p>
                  </div>
                );
              })()}

              <div
                className="rounded-xl p-4"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(245,200,66,0.1) 0%, rgba(13,24,41,0.95) 100%)',
                  border: '1px solid rgba(245,200,66,0.3)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <div className="font-semibold text-brand-gold">Bônus de boas-vindas</div>
                    <div className="text-sm text-text-secondary">
                      Você começa com <strong className="text-brand-gold">+100 XP</strong> só por
                      completar o onboarding!
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="btn-ghost flex-1">
                  Voltar
                </button>
                <button
                  onClick={finishOnboarding}
                  disabled={loading}
                  className="btn-primary flex-1 py-4 text-base"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Configurando...
                    </span>
                  ) : (
                    'Começar minha jornada →'
                  )}
                </button>
                {finishError && (
                  <p className="mt-2 text-center text-xs" style={{ color: '#EF4444' }}>
                    {finishError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 5: Quick Win — marcar primeiro hábito ── */}
          {step === 5 && firstHabit && (
            <div className="space-y-6 text-center">
              <div>
                <div className="mb-3 text-6xl">{quickWinDone ? '🎉' : firstHabit.icon}</div>
                <h2 className="mb-2 text-2xl font-bold">
                  {quickWinDone ? 'Primeira vitória!' : 'Sua primeira missão'}
                </h2>
                <p className="text-sm text-text-secondary">
                  {quickWinDone
                    ? 'Você marcou seu primeiro hábito. A jornada começou!'
                    : 'Marque seu primeiro hábito agora e ganhe +50 XP imediatamente.'}
                </p>
              </div>

              {!quickWinDone ? (
                <>
                  {/* Habit card */}
                  <div
                    className="relative mx-auto max-w-xs overflow-hidden rounded-2xl p-5"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(255,77,0,0.12) 0%, rgba(13,24,41,0.98) 100%)',
                      border: '1px solid rgba(255,77,0,0.3)',
                    }}
                  >
                    <div className="mb-2 text-4xl">{firstHabit.icon}</div>
                    <div className="text-lg font-bold">{firstHabit.name}</div>
                    <div
                      className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{ background: 'rgba(245,200,66,0.15)', color: '#F5C842' }}
                    >
                      ⚡ +50 XP
                    </div>
                  </div>

                  <button
                    onClick={handleQuickWin}
                    disabled={quickWinLoading}
                    className="w-full rounded-2xl py-4 text-lg font-black transition-all active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #FF4D00, #FF6B35)',
                      color: '#fff',
                      boxShadow: '0 8px 32px rgba(255,77,0,0.35)',
                    }}
                  >
                    {quickWinLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Registrando...
                      </span>
                    ) : (
                      `✓ Marcar "${firstHabit.name}" →`
                    )}
                  </button>

                  <button
                    onClick={skipToDashboard}
                    className="text-xs text-text-muted transition-colors hover:text-text-secondary"
                  >
                    Pular por agora
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <div
                    className="rounded-2xl px-6 py-4 text-center"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(0,255,136,0.12) 0%, rgba(13,24,41,0.98) 100%)',
                      border: '1px solid rgba(0,255,136,0.3)',
                    }}
                  >
                    <div className="text-2xl font-black" style={{ color: '#00FF88' }}>
                      +50 XP
                    </div>
                    <div className="mt-1 text-sm text-text-secondary">
                      Adicionados ao seu perfil!
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-text-muted border-t-brand-orange" />
                    Abrindo seu dashboard...
                  </div>
                </div>
              )}
            </div>
          )}
          {/* ── Step 6: Push opt-in — momento pós-vitória, maior conversão ── */}
          {step === 6 && (
            <div className="space-y-6 text-center">
              <div>
                <div className="mb-3 text-6xl">
                  {pushStatus === 'granted' ? '✅' : pushStatus === 'denied' ? '😔' : '🔔'}
                </div>
                <h2 className="mb-2 text-2xl font-bold">
                  {pushStatus === 'granted'
                    ? 'Notificações ativadas!'
                    : pushStatus === 'denied'
                      ? 'Tudo bem, pode pular'
                      : 'Ative os avisos e nunca perca seu streak'}
                </h2>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {pushStatus === 'granted'
                    ? 'Você vai receber lembretes de hábitos, alertas de streak e conquistas desbloqueadas.'
                    : pushStatus === 'denied'
                      ? 'Você pode ativar mais tarde em Configurações do navegador.'
                      : 'O Ascendia avisa quando seu streak estiver em risco, quando você ganhar conquistas e no recap diário.'}
                </p>
              </div>

              {(pushStatus === 'idle' || pushStatus === 'loading') && (
                <>
                  {/* Exemplos de notificações */}
                  <div className="space-y-2 text-left">
                    {[
                      { icon: '🔥', text: 'Seu streak de 7 dias está em risco!', color: '#FF4D00' },
                      {
                        icon: '🏆',
                        text: 'Conquista desbloqueada: Guerreiro da Semana',
                        color: '#F5C842',
                      },
                      { icon: '⚡', text: '+150 XP hoje — recap do seu dia', color: '#7C3AED' },
                    ].map((ex, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl px-4 py-3"
                        style={{
                          background: 'rgba(13,24,41,0.8)',
                          border: '1px solid rgba(255,255,255,0.07)',
                        }}
                      >
                        <span className="text-xl">{ex.icon}</span>
                        <span className="text-sm text-text-secondary">{ex.text}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleEnablePush}
                    disabled={pushStatus === 'loading'}
                    className="w-full rounded-2xl py-4 text-base font-black transition-all active:scale-95 disabled:opacity-70"
                    style={{
                      background: 'linear-gradient(135deg, #7C3AED, #FF4D00)',
                      color: '#fff',
                      boxShadow: '0 8px 32px rgba(124,58,237,0.35)',
                    }}
                  >
                    {pushStatus === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Ativando...
                      </span>
                    ) : (
                      '🔔 Ativar notificações →'
                    )}
                  </button>
                  <button
                    onClick={goToDashboard}
                    className="text-xs text-text-muted transition-colors hover:text-text-secondary"
                  >
                    Agora não
                  </button>
                </>
              )}

              {pushStatus === 'granted' && (
                <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-text-muted border-t-brand-orange" />
                  Abrindo seu dashboard...
                </div>
              )}

              {pushStatus === 'denied' && (
                <button onClick={goToDashboard} className="btn-primary w-full">
                  Ir para o dashboard →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function getSuggestedHabitsMulti(goals: string[]) {
  const seen = new Set<string>();
  const result: ReturnType<typeof getSuggestedHabits> = [];
  for (const g of goals) {
    for (const h of getSuggestedHabits(g)) {
      const key = String((h as Record<string, unknown>)['name'] ?? '');
      if (!seen.has(key)) {
        seen.add(key);
        result.push(h);
      }
    }
  }
  return result.slice(0, 6); // cap at 6 to not overwhelm new user
}

function getSuggestedHabits(goal: string) {
  const base = { is_active: true, target_period: 'week' as const, xp_per_completion: 50 };
  const map: Record<string, Array<Record<string, unknown>>> = {
    lose_weight: [
      {
        name: 'Treinar',
        icon: '💪',
        color: '#FF4D00',
        category: 'strength',
        target_type: 'count',
        target_value: 4,
        target_unit: 'treinos',
        frequency_per_week: 4,
      },
      {
        name: 'Cardio 30min',
        icon: '🏃',
        color: '#00FF88',
        category: 'cardio',
        target_type: 'minutes',
        target_value: 30,
        target_unit: 'min',
        frequency_per_week: 4,
      },
      {
        name: 'Beber 2L água',
        icon: '💧',
        color: '#3B82F6',
        category: 'nutrition',
        target_type: 'count',
        target_value: 1,
        target_unit: 'vez',
        frequency_per_week: 7,
      },
    ],
    gain_muscle: [
      {
        name: 'Treinar',
        icon: '💪',
        color: '#FF4D00',
        category: 'strength',
        target_type: 'count',
        target_value: 5,
        target_unit: 'treinos',
        frequency_per_week: 5,
      },
      {
        name: 'Comer proteína',
        icon: '🍗',
        color: '#F59E0B',
        category: 'nutrition',
        target_type: 'count',
        target_value: 1,
        target_unit: 'vez',
        frequency_per_week: 7,
      },
      {
        name: 'Dormir 7h+',
        icon: '😴',
        color: '#7C3AED',
        category: 'sleep',
        target_type: 'count',
        target_value: 1,
        target_unit: 'vez',
        frequency_per_week: 7,
      },
    ],
    consistency: [
      {
        name: 'Hábito principal',
        icon: '🎯',
        color: '#FF4D00',
        category: 'custom',
        target_type: 'count',
        target_value: 1,
        target_unit: 'vez',
        frequency_per_week: 5,
      },
      {
        name: 'Revisar o dia',
        icon: '📋',
        color: '#7C3AED',
        category: 'custom',
        target_type: 'count',
        target_value: 1,
        target_unit: 'vez',
        frequency_per_week: 7,
      },
    ],
    health: [
      {
        name: 'Caminhar 30min',
        icon: '🚶',
        color: '#00FF88',
        category: 'cardio',
        target_type: 'minutes',
        target_value: 30,
        target_unit: 'min',
        frequency_per_week: 5,
      },
      {
        name: 'Meditar 10min',
        icon: '🧘',
        color: '#7C3AED',
        category: 'mindfulness',
        target_type: 'minutes',
        target_value: 10,
        target_unit: 'min',
        frequency_per_week: 5,
      },
      {
        name: 'Dormir 8h',
        icon: '😴',
        color: '#3B82F6',
        category: 'sleep',
        target_type: 'count',
        target_value: 1,
        target_unit: 'vez',
        frequency_per_week: 7,
      },
    ],
    productivity: [
      {
        name: 'Focus 2h',
        icon: '⚡',
        color: '#FF4D00',
        category: 'custom',
        target_type: 'minutes',
        target_value: 120,
        target_unit: 'min',
        frequency_per_week: 5,
      },
      {
        name: 'Planejar o dia',
        icon: '📋',
        color: '#7C3AED',
        category: 'custom',
        target_type: 'count',
        target_value: 1,
        target_unit: 'vez',
        frequency_per_week: 7,
      },
      {
        name: 'Ler 20min',
        icon: '📖',
        color: '#00FF88',
        category: 'custom',
        target_type: 'minutes',
        target_value: 20,
        target_unit: 'min',
        frequency_per_week: 5,
      },
    ],
    finance: [
      {
        name: 'Registrar gastos',
        icon: '💰',
        color: '#00FF88',
        category: 'custom',
        target_type: 'count',
        target_value: 1,
        target_unit: 'vez',
        frequency_per_week: 7,
      },
      {
        name: 'Revisar extratos',
        icon: '📊',
        color: '#F5C842',
        category: 'custom',
        target_type: 'count',
        target_value: 1,
        target_unit: 'vez',
        frequency_per_week: 1,
      },
    ],
  };
  return (map[goal] ?? []).map((h) => ({ ...base, ...h }));
}
