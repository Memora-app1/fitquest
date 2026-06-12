/**
 * NextAction — widget server-side com a ÚNICA ação mais rápida para ganhar XP agora.
 * Analisa o estado do dia e retorna a oportunidade de maior XP com menor esforço.
 * Aparece apenas quando há uma ação clara a tomar.
 */

import { createClient } from '@/lib/supabase/server';
import { todayString } from '@/lib/utils';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export async function NextAction({ userId }: { userId: string }) {
  const supabase = await createClient();
  const today = todayString();

  const [habitsRes, habitLogsRes, workoutRes, sleepRes, profileRes] = await Promise.all([
    supabase.from('habits').select('id, name').eq('user_id', userId).eq('is_active', true),
    supabase.from('habit_logs').select('habit_id').eq('user_id', userId).eq('logged_date', today),
    supabase
      .from('workouts')
      .select('id')
      .eq('user_id', userId)
      .gte('started_at', `${today}T00:00:00`)
      .limit(1),
    supabase.from('sleep_logs').select('id').eq('user_id', userId).eq('date', today).maybeSingle(),
    supabase.from('profiles').select('streak_current').eq('id', userId).single(),
  ]);

  const habits = habitsRes.data ?? [];
  const loggedIds = new Set((habitLogsRes.data ?? []).map((l) => l.habit_id));
  const pendingHabits = habits.filter((h) => !loggedIds.has(h.id));
  const hasTrained = (workoutRes.data ?? []).length > 0;
  const hasSleep = sleepRes.data !== null;
  const streak = (profileRes.data?.streak_current as number | null) ?? 0;

  // Prioridade: maior XP + menor esforço
  type Action = {
    emoji: string;
    title: string;
    sub: string;
    xp: number;
    href: string;
    color: string;
    rgb: string;
  };

  const candidates: Action[] = [];

  // Hábito pendente (50 XP por hábito)
  if (pendingHabits.length > 0) {
    const first = pendingHabits[0]!;
    candidates.push({
      emoji: '🎯',
      title: `Registrar: ${first.name}`,
      sub: `${pendingHabits.length} hábito${pendingHabits.length > 1 ? 's' : ''} pendente${pendingHabits.length > 1 ? 's' : ''} hoje`,
      xp: pendingHabits.length * 50,
      href: '/habitos',
      color: '#FF4D00',
      rgb: '255,77,0',
    });
  }

  // Treino (100+ XP)
  if (!hasTrained) {
    candidates.push({
      emoji: '💪',
      title: 'Treinar hoje',
      sub: 'Você ainda não treinou hoje',
      xp: 100,
      href: '/treinos/novo',
      color: '#00FF88',
      rgb: '0,255,136',
    });
  }

  // Registrar sono (+20 XP)
  if (!hasSleep) {
    candidates.push({
      emoji: '🌙',
      title: 'Registrar sono de ontem',
      sub: '20 XP + impacta seu Recovery Score',
      xp: 20,
      href: '/saude',
      color: '#7C3AED',
      rgb: '124,58,237',
    });
  }

  // Streak em risco (sem atividade + streak > 3)
  if (pendingHabits.length > 0 && streak >= 3) {
    candidates.unshift({
      emoji: '🔥',
      title: `Proteger streak de ${streak} dias`,
      sub: 'Registre um hábito antes da meia-noite',
      xp: 50,
      href: '/habitos',
      color: '#EF4444',
      rgb: '239,68,68',
    });
  }

  if (candidates.length === 0) return null;

  // Pega a de maior XP (já ordenada por streak primeiro se aplicável)
  const best = candidates[0]!;

  return (
    <Link
      href={best.href}
      className="relative block animate-fade-in overflow-hidden rounded-2xl p-4 transition-all hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background: `linear-gradient(135deg, rgba(${best.rgb},0.10) 0%, rgba(13,24,41,0.98) 60%, rgba(${best.rgb},0.04) 100%)`,
        border: `1px solid rgba(${best.rgb},0.25)`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full blur-2xl"
        style={{ background: `rgba(${best.rgb},0.1)` }}
      />

      <div className="relative z-10 flex items-center gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
          style={{
            background: `rgba(${best.rgb},0.12)`,
            border: `1px solid rgba(${best.rgb},0.25)`,
          }}
        >
          {best.emoji}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
              Fazer agora
            </span>
          </div>
          <div className="truncate text-sm font-bold">{best.title}</div>
          <div className="text-xs text-text-secondary">{best.sub}</div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <div
            className="flex items-center gap-1 rounded-xl px-2 py-1"
            style={{
              background: 'rgba(245,200,66,0.12)',
              border: '1px solid rgba(245,200,66,0.2)',
            }}
          >
            <Zap size={10} style={{ color: '#F5C842' }} fill="currentColor" />
            <span className="text-xs font-black" style={{ color: '#F5C842' }}>
              +{best.xp} XP
            </span>
          </div>
          <span className="text-[10px] text-text-muted">→</span>
        </div>
      </div>
    </Link>
  );
}
