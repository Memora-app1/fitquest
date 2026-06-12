import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import {
  Trophy,
  Star,
  Lock,
  Zap,
  Target,
  Dumbbell,
  CheckSquare,
  Droplets,
  Moon,
  Flame,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Conquistas',
  description: 'Veja todas as suas conquistas desbloqueadas e as que ainda estão por vir.',
};

export const dynamic = 'force-dynamic';

type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

const RARITY_CONFIG: Record<Rarity, { label: string; color: string; rgb: string; emoji: string }> =
  {
    common: { label: 'Comum', color: '#8899BB', rgb: '136,153,187', emoji: '⬜' },
    rare: { label: 'Raro', color: '#3B82F6', rgb: '59,130,246', emoji: '🔷' },
    epic: { label: 'Épico', color: '#7C3AED', rgb: '124,58,237', emoji: '💜' },
    legendary: { label: 'Lendário', color: '#F5C842', rgb: '245,200,66', emoji: '🌟' },
  };

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  habit: Target,
  workout: Dumbbell,
  task: CheckSquare,
  health: Droplets,
  streak: Flame,
  xp: Zap,
  finance: Star,
};

function CategoryIcon({ category, size = 14 }: { category: string; size?: number }) {
  const Icon = CATEGORY_ICONS[category] ?? Trophy;
  return <Icon size={size} />;
}

export default async function ConquistasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    allAchievementsRes,
    userAchievementsRes,
    profileRes,
    workoutsCountRes,
    tasksCountRes,
    habitLogsCountRes,
  ] = await Promise.all([
    supabase
      .from('achievements')
      .select(
        'id, slug, name, description, icon, xp_reward, rarity, category, trigger_type, trigger_value'
      )
      .order('rarity', { ascending: true })
      .order('name'),
    supabase.from('user_achievements').select('achievement_id, unlocked_at').eq('user_id', user.id),
    supabase
      .from('profiles')
      .select('xp_total, level, streak_current, streak_longest, perfect_days')
      .eq('id', user.id)
      .single(),
    supabase
      .from('workouts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('finished_at', 'is', null),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'done'),
    supabase.from('habit_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);

  const allAchievements = allAchievementsRes.data ?? [];
  const userAchievements = userAchievementsRes.data ?? [];
  const profile = profileRes.data;

  // Contadores para progresso de conquistas bloqueadas
  const workoutCount = workoutsCountRes.count ?? 0;
  const taskCount = tasksCountRes.count ?? 0;
  const habitLogCount = habitLogsCountRes.count ?? 0;
  const streakCurrent = profile?.streak_current ?? 0;

  // Retorna progresso [current, max] para conquistas de contagem
  function getProgress(slug: string): [number, number] | null {
    const t = profile?.streak_current ?? 0;
    if (slug.startsWith('workouts_')) return [workoutCount, parseInt(slug.split('_')[1] ?? '0')];
    if (slug.startsWith('tasks_')) return [taskCount, parseInt(slug.split('_')[1] ?? '0')];
    if (slug.startsWith('habits_')) return [habitLogCount, parseInt(slug.split('_')[1] ?? '0')];
    if (slug.startsWith('streak_')) return [streakCurrent, parseInt(slug.split('_')[1] ?? '0')];
    if (slug === 'perfect_week') return [profile?.perfect_days ?? 0, 7];
    if (slug === 'subtasks_50') return [null as unknown as number, 50];
    return null;
  }

  const unlockedIds = new Set(userAchievements.map((a) => a.achievement_id));
  const unlockedCount = unlockedIds.size;
  const totalCount = allAchievements.length;
  const completionPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  // Progress map
  const unlockedAtMap = new Map(userAchievements.map((a) => [a.achievement_id, a.unlocked_at]));

  // Sort: unlocked first (most recent first), then locked by rarity
  const sorted = [...allAchievements].sort((a, b) => {
    const aUnlocked = unlockedIds.has(a.id);
    const bUnlocked = unlockedIds.has(b.id);
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    if (aUnlocked && bUnlocked) {
      const aDate = unlockedAtMap.get(a.id) ?? '';
      const bDate = unlockedAtMap.get(b.id) ?? '';
      return bDate.localeCompare(aDate);
    }
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    return (rarityOrder[a.rarity as Rarity] ?? 3) - (rarityOrder[b.rarity as Rarity] ?? 3);
  });

  // Group by rarity for stats
  const byRarity: Record<Rarity, { total: number; unlocked: number }> = {
    legendary: { total: 0, unlocked: 0 },
    epic: { total: 0, unlocked: 0 },
    rare: { total: 0, unlocked: 0 },
    common: { total: 0, unlocked: 0 },
  };
  for (const a of allAchievements) {
    const r = (a.rarity as Rarity) ?? 'common';
    if (byRarity[r]) {
      byRarity[r].total++;
      if (unlockedIds.has(a.id)) byRarity[r].unlocked++;
    }
  }

  // Total XP from achievements
  const totalAchievementXp = userAchievements.reduce((s, ua) => {
    const achievement = allAchievements.find((a) => a.id === ua.achievement_id);
    return s + ((achievement?.xp_reward as number) ?? 0);
  }, 0);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
        {/* ── Hero Header ─────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background:
              'linear-gradient(135deg, rgba(245,200,66,0.10) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.06) 100%)',
            border: '1px solid rgba(245,200,66,0.25)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(245,200,66,0.12) 0%, transparent 70%)',
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-6 -left-6 h-32 w-32 rounded-full blur-2xl"
            style={{ background: 'rgba(124,58,237,0.08)' }}
          />
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Trophy size={14} style={{ color: '#F5C842' }} />
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: '#F5C842' }}
                >
                  Conquistas
                </span>
              </div>
              <h1 className="heading-display text-4xl md:text-5xl">Sua Coleção</h1>
              <p className="mt-1 text-text-secondary">
                {unlockedCount === totalCount
                  ? '🏆 Todas as conquistas desbloqueadas! Você é lendário.'
                  : `${unlockedCount}/${totalCount} conquistas · ${completionPct}% completo`}
              </p>
            </div>

            {/* Score */}
            <div className="shrink-0 text-right">
              <div className="text-3xl font-black" style={{ color: '#F5C842' }}>
                {completionPct}%
              </div>
              <div className="text-xs uppercase tracking-wider text-text-muted">completo</div>
              {totalAchievementXp > 0 && (
                <div className="mt-1 flex items-center justify-end gap-1">
                  <Zap size={10} style={{ color: '#F5C842' }} fill="currentColor" />
                  <span className="text-xs font-bold text-text-secondary">
                    +{totalAchievementXp.toLocaleString('pt-BR')} XP de conquistas
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="relative z-10 mt-4">
            <div
              className="h-2 overflow-hidden rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${completionPct}%`,
                  background:
                    completionPct === 100
                      ? 'linear-gradient(90deg, #F5C842, #FF4D00)'
                      : 'linear-gradient(90deg, #F5C842, #7C3AED)',
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Rarity breakdown ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {(Object.entries(byRarity) as [Rarity, { total: number; unlocked: number }][])
            .sort((a, b) => {
              const order = { legendary: 0, epic: 1, rare: 2, common: 3 };
              return order[a[0]] - order[b[0]];
            })
            .map(([rarity, { total, unlocked }]) => {
              const rc = RARITY_CONFIG[rarity];
              const pct = total > 0 ? Math.round((unlocked / total) * 100) : 0;
              return (
                <div
                  key={rarity}
                  className="relative overflow-hidden rounded-2xl p-4"
                  style={{
                    background: `linear-gradient(135deg, rgba(${rc.rgb},0.08) 0%, rgba(13,24,41,0.98) 100%)`,
                    border: `1px solid rgba(${rc.rgb},0.2)`,
                  }}
                >
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="text-sm">{rc.emoji}</span>
                    <span className="text-[10px] uppercase tracking-wider text-text-muted">
                      {rc.label}
                    </span>
                  </div>
                  <div className="heading-display text-xl" style={{ color: rc.color }}>
                    {unlocked}/{total}
                  </div>
                  <div
                    className="mt-2 h-1 overflow-hidden rounded-full"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: rc.color, opacity: 0.8 }}
                    />
                  </div>
                </div>
              );
            })}
        </div>

        {/* ── Achievement grid ─────────────────────────────────────────── */}
        {totalCount === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <Trophy size={40} className="mx-auto mb-3 text-text-muted" />
            <p className="text-text-secondary">Nenhuma conquista configurada ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {sorted.map((achievement) => {
              const unlocked = unlockedIds.has(achievement.id);
              const rarity = (achievement.rarity as Rarity) ?? 'common';
              const rc = RARITY_CONFIG[rarity];
              const unlockedAt = unlockedAtMap.get(achievement.id);

              return (
                <div
                  key={achievement.id}
                  className={`relative overflow-hidden rounded-2xl p-4 transition-all ${
                    unlocked ? 'hover:scale-[1.02]' : 'opacity-70'
                  }`}
                  style={{
                    background: unlocked
                      ? `linear-gradient(135deg, rgba(${rc.rgb},0.10) 0%, rgba(13,24,41,0.98) 100%)`
                      : 'rgba(255,255,255,0.025)',
                    border: unlocked
                      ? `1px solid rgba(${rc.rgb},0.3)`
                      : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Glow for unlocked */}
                  {unlocked && (
                    <div
                      className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full blur-2xl"
                      style={{ background: `rgba(${rc.rgb},0.15)` }}
                    />
                  )}

                  <div className="relative z-10">
                    <div className="flex items-start gap-3">
                      {/* Emoji / lock */}
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${
                          unlocked ? 'animate-bounce-in' : ''
                        }`}
                        style={{
                          background: unlocked ? `rgba(${rc.rgb},0.15)` : 'rgba(255,255,255,0.04)',
                          border: unlocked
                            ? `1px solid rgba(${rc.rgb},0.3)`
                            : '1px solid rgba(255,255,255,0.06)',
                          filter: unlocked ? 'none' : 'grayscale(1)',
                        }}
                      >
                        {unlocked ? (achievement.icon as string) : '🔒'}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                          <span
                            className="text-sm font-bold leading-tight"
                            style={{ color: unlocked ? rc.color : '#8899BB' }}
                          >
                            {achievement.name}
                          </span>
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase"
                            style={{
                              color: rc.color,
                              background: `rgba(${rc.rgb},0.15)`,
                            }}
                          >
                            {rc.label}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-text-muted">
                          {unlocked
                            ? achievement.description
                            : achievement.category === 'streak'
                              ? 'Complete dias consecutivos para desbloquear.'
                              : achievement.category === 'habit'
                                ? 'Registre hábitos diariamente para desbloquear.'
                                : achievement.category === 'workout'
                                  ? 'Complete treinos para desbloquear.'
                                  : achievement.category === 'task'
                                    ? 'Conclua tarefas para desbloquear.'
                                    : achievement.category === 'finance'
                                      ? 'Registre transações para desbloquear.'
                                      : achievement.category === 'xp'
                                        ? 'Acumule XP suficiente para desbloquear.'
                                        : 'Continue usando o Ascendia para desbloquear.'}
                        </p>
                      </div>
                    </div>

                    {/* Barra de progresso para conquistas bloqueadas de contagem */}
                    {!unlocked &&
                      (() => {
                        const slug = achievement.slug as string;
                        const prog = getProgress(slug);
                        if (!prog || typeof prog[0] !== 'number') return null;
                        const [current, max] = prog;
                        const pct = Math.min(100, Math.round((current / max) * 100));
                        if (pct === 0) return null;
                        return (
                          <div className="mt-2.5">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-[9px] text-text-muted">Progresso</span>
                              <span className="text-[9px] font-bold" style={{ color: rc.color }}>
                                {current}/{max}
                              </span>
                            </div>
                            <div
                              className="h-1 overflow-hidden rounded-full"
                              style={{ background: 'rgba(255,255,255,0.06)' }}
                            >
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, background: rc.color, opacity: 0.7 }}
                              />
                            </div>
                          </div>
                        );
                      })()}

                    {/* XP reward + date */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <CategoryIcon category={achievement.category as string} size={11} />
                        <span className="text-[9px] uppercase tracking-wider text-text-muted">
                          {achievement.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {unlockedAt && (
                          <span className="text-[9px] text-text-muted">
                            {new Date(unlockedAt).toLocaleDateString('pt-BR', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        )}
                        <span
                          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black"
                          style={{
                            color: unlocked ? rc.color : '#556677',
                            background: unlocked
                              ? `rgba(${rc.rgb},0.12)`
                              : 'rgba(255,255,255,0.04)',
                          }}
                        >
                          <Zap size={9} />+{achievement.xp_reward}XP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Motivational footer ──────────────────────────────────────── */}
        {unlockedCount < totalCount && (
          <div
            className="rounded-2xl p-5 text-center"
            style={{
              background: 'rgba(245,200,66,0.05)',
              border: '1px solid rgba(245,200,66,0.12)',
            }}
          >
            <p className="text-sm text-text-secondary">
              Você está a{' '}
              <strong className="text-brand-gold">
                {totalCount - unlockedCount} conquista{totalCount - unlockedCount !== 1 ? 's' : ''}
              </strong>{' '}
              de completar sua coleção. <span className="text-white">Continue assim!</span>
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
