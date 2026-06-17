import { createClient } from '@/lib/supabase/server';
import { Trophy, Zap, Lock } from 'lucide-react';

interface AchievementRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  rarity: string;
  category: string;
}

interface UserStats {
  totalWorkouts: number;
  totalTasks: number;
  totalHabitLogs: number;
  streakCurrent: number;
  streakLongest: number;
  perfectDays: number;
  totalTransactions: number;
  level: number;
  totalHabits: number;
}

// Estimativa de progresso para cada slug de conquista
function estimateProgress(
  slug: string,
  stats: UserStats
): { current: number; target: number } | null {
  const s = slug.toLowerCase();

  // Streak-based
  if (s === 'streak_3') return { current: stats.streakCurrent, target: 3 };
  if (s === 'streak_7') return { current: stats.streakCurrent, target: 7 };
  if (s === 'streak_14') return { current: stats.streakCurrent, target: 14 };
  if (s === 'streak_30') return { current: stats.streakCurrent, target: 30 };
  if (s === 'streak_60') return { current: stats.streakCurrent, target: 60 };
  if (s === 'streak_90') return { current: stats.streakCurrent, target: 90 };
  if (s === 'streak_100') return { current: stats.streakCurrent, target: 100 };
  if (s === 'streak_180') return { current: stats.streakCurrent, target: 180 };
  if (s === 'streak_365') return { current: stats.streakCurrent, target: 365 };

  // Habit-based (first_habit usa totalHabits criados; logs usam totalHabitLogs)
  if (s === 'first_habit') return { current: stats.totalHabits, target: 1 };
  if (s === 'habit_logs_10') return { current: stats.totalHabitLogs, target: 10 };
  if (s === 'habit_logs_50') return { current: stats.totalHabitLogs, target: 50 };
  if (s === 'habit_logs_100') return { current: stats.totalHabitLogs, target: 100 };
  if (s === 'habit_logs_365') return { current: stats.totalHabitLogs, target: 365 };

  // Workout-based
  if (s === 'first_workout') return { current: stats.totalWorkouts, target: 1 };
  if (s === 'workouts_5') return { current: stats.totalWorkouts, target: 5 };
  if (s === 'workouts_10') return { current: stats.totalWorkouts, target: 10 };
  if (s === 'workouts_25') return { current: stats.totalWorkouts, target: 25 };
  if (s === 'workouts_50') return { current: stats.totalWorkouts, target: 50 };
  if (s === 'workouts_100') return { current: stats.totalWorkouts, target: 100 };

  // Task-based
  if (s === 'first_task') return { current: stats.totalTasks, target: 1 };
  if (s === 'tasks_10') return { current: stats.totalTasks, target: 10 };
  if (s === 'tasks_25') return { current: stats.totalTasks, target: 25 };
  if (s === 'tasks_50') return { current: stats.totalTasks, target: 50 };
  if (s === 'tasks_100') return { current: stats.totalTasks, target: 100 };
  if (s === 'tasks_200') return { current: stats.totalTasks, target: 200 };

  // Level-based
  if (s.startsWith('level_')) {
    const target = parseInt(s.replace('level_', ''), 10);
    if (!isNaN(target)) return { current: stats.level, target };
  }

  // Perfect days
  if (s === 'perfect_day') return { current: stats.perfectDays, target: 1 };
  if (s === 'perfect_days_3') return { current: stats.perfectDays, target: 3 };
  if (s === 'perfect_week') return { current: stats.perfectDays, target: 7 };
  if (s === 'perfect_days_7') return { current: stats.perfectDays, target: 7 };
  if (s === 'perfect_days_30') return { current: stats.perfectDays, target: 30 };

  // Transaction-based
  if (s === 'first_transaction') return { current: stats.totalTransactions, target: 1 };
  if (s === 'transactions_10') return { current: stats.totalTransactions, target: 10 };
  if (s === 'transactions_50') return { current: stats.totalTransactions, target: 50 };
  if (s === 'transactions_100') return { current: stats.totalTransactions, target: 100 };

  return null;
}

const RARITY_COLOR: Record<string, string> = {
  common: '#8899BB',
  rare: '#3B82F6',
  epic: '#7C3AED',
  legendary: '#F5C842',
};

export async function NextAchievementWidget({ userId }: { userId: string }) {
  const supabase = await createClient();

  const [unlockedRes, allRes, profileRes, workoutsRes, tasksRes, habitLogsRes, txRes, habitsRes] =
    await Promise.all([
      supabase.from('user_achievements').select('achievement_id').eq('user_id', userId).limit(200),
      supabase
        .from('achievements')
        .select('id, slug, name, description, icon, xp_reward, rarity, category')
        .limit(200),
      supabase
        .from('profiles')
        .select('level, streak_current, streak_longest, perfect_days')
        .eq('id', userId)
        .single(),
      supabase
        .from('workouts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('finished_at', 'is', null),
      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'done'),
      supabase
        .from('habit_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('habits')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true),
    ]);

  const unlockedIds = new Set((unlockedRes.data ?? []).map((u) => u.achievement_id));
  const allAchievements = (allRes.data ?? []) as AchievementRow[];
  const locked = allAchievements.filter((a) => !unlockedIds.has(a.id));

  if (locked.length === 0) return null;

  const stats: UserStats = {
    totalWorkouts: workoutsRes.count ?? 0,
    totalTasks: tasksRes.count ?? 0,
    totalHabitLogs: habitLogsRes.count ?? 0,
    streakCurrent: profileRes.data?.streak_current ?? 0,
    streakLongest: profileRes.data?.streak_longest ?? 0,
    perfectDays: profileRes.data?.perfect_days ?? 0,
    totalTransactions: txRes.count ?? 0,
    level: profileRes.data?.level ?? 1,
    totalHabits: habitsRes.count ?? 0,
  };

  // Encontra a conquista mais próxima de ser desbloqueada
  let bestAchievement: AchievementRow | null = null;
  let bestProgress: { current: number; target: number } | null = null;
  let bestPct = -1;

  for (const achievement of locked) {
    const prog = estimateProgress(achievement.slug, stats);
    if (!prog) continue;
    const pct = Math.min(99, Math.round((prog.current / prog.target) * 100));
    if (pct > bestPct) {
      bestPct = pct;
      bestAchievement = achievement;
      bestProgress = prog;
    }
  }

  if (!bestAchievement || !bestProgress) return null;

  const accentColor = RARITY_COLOR[bestAchievement.rarity] ?? '#8899BB';
  const remaining = Math.max(0, bestProgress.target - bestProgress.current);

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background: `linear-gradient(135deg, ${accentColor}0C 0%, rgba(13,24,41,0.98) 100%)`,
        border: `1px solid ${accentColor}22`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full blur-2xl"
        style={{ backgroundColor: accentColor, opacity: 0.12 }}
      />

      <div className="relative z-10 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-lg"
            style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}28` }}
          >
            <Trophy size={12} style={{ color: accentColor }} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Próxima conquista
          </span>
          <div className="ml-auto">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
              style={{ color: accentColor, background: `${accentColor}15` }}
            >
              {bestAchievement.rarity}
            </span>
          </div>
        </div>

        {/* Achievement info */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
            style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}20` }}
          >
            {bestAchievement.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold">{bestAchievement.name}</div>
            <div className="mt-0.5 line-clamp-1 text-[11px] text-text-muted">
              {bestAchievement.description}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div
              className="flex items-center gap-0.5 text-[11px] font-black"
              style={{ color: '#F5C842' }}
            >
              <Zap size={10} fill="currentColor" />+{bestAchievement.xp_reward}
            </div>
            <div className="mt-0.5 text-[10px] text-text-muted">XP</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-text-muted">
              {bestProgress.current.toLocaleString('pt-BR')} /{' '}
              {bestProgress.target.toLocaleString('pt-BR')}
            </span>
            <span className="flex items-center gap-1 font-bold" style={{ color: accentColor }}>
              <Lock size={9} />
              Falta{remaining !== 1 ? 'm' : ''} {remaining.toLocaleString('pt-BR')}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${bestPct}%`,
                background: `linear-gradient(90deg, ${accentColor}, ${accentColor}99)`,
                boxShadow: `0 0 8px ${accentColor}50`,
              }}
            />
          </div>
          <div className="text-right text-[10px] text-text-muted">{bestPct}% completo</div>
        </div>
      </div>
    </div>
  );
}
