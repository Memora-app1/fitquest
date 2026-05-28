/**
 * Sistema unificado de XP do Ascendia — funções puras, seguras para client e server.
 *
 * Para conceder XP (operação server-only), use src/lib/xp-server.ts
 */

// ════════ XP POR AÇÃO ════════
export const XP_REWARDS = {
  // Hábitos
  HABIT_COMPLETED: 50,
  PERFECT_DAY: 200, // bônus quando completa TODOS os hábitos do dia

  // Treinos
  WORKOUT_COMPLETED: 100,
  WORKOUT_SET_BONUS: 5, // por set (max +200 = +300 total)
  WORKOUT_SET_BONUS_MAX: 200,
  PERSONAL_RECORD: 150,

  // Tarefas
  TASK_COMPLETED: 30,
  TASK_URGENT_IMPORTANT: 50, // urgent + important

  // Finanças
  TRANSACTION_LOGGED: 5,
  BILL_PAID_ON_TIME: 20,
  FINANCE_GOAL_HIT: 500,

  // Streak
  STREAK_3_DAYS: 100,
  STREAK_7_DAYS: 300,
  STREAK_30_DAYS: 1000,
  STREAK_90_DAYS: 3000,

  // Outros
  ONBOARDING_COMPLETED: 100,
  FIRST_TIME_BONUS: 100, // primeira vez fazendo algo
} as const

// ════════ LEVELS ════════
export const LEVELS = [
  { level: 1, minXp: 0, maxXp: 500, title: 'Iniciante', emoji: '🌱' },
  { level: 2, minXp: 500, maxXp: 1500, title: 'Dedicado', emoji: '🥉' },
  { level: 3, minXp: 1500, maxXp: 3500, title: 'Consistente', emoji: '🥈' },
  { level: 4, minXp: 3500, maxXp: 7000, title: 'Atleta', emoji: '🥇' },
  { level: 5, minXp: 7000, maxXp: 12000, title: 'Guerreiro', emoji: '⚔️' },
  { level: 6, minXp: 12000, maxXp: 20000, title: 'Elite', emoji: '🛡️' },
  { level: 7, minXp: 20000, maxXp: 35000, title: 'Lendário', emoji: '🏛️' },
  { level: 8, minXp: 35000, maxXp: Infinity, title: 'Ascendia Master', emoji: '👑' },
] as const

export function calculateLevel(xp: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i]!.minXp) return LEVELS[i]!.level
  }
  return 1
}

export function getLevelInfo(level: number) {
  return LEVELS.find((l) => l.level === level) ?? LEVELS[0]!
}

export function getXpProgressToNextLevel(xp: number): {
  current: number
  needed: number
  percentage: number
} {
  const level = calculateLevel(xp)
  const info = getLevelInfo(level)
  if (info.maxXp === Infinity) {
    return { current: xp - info.minXp, needed: 0, percentage: 100 }
  }
  const current = xp - info.minXp
  const needed = info.maxXp - info.minXp
  const percentage = Math.min(100, Math.round((current / needed) * 100))
  return { current, needed, percentage }
}

// ════════ TIPOS ════════
export type XpSourceType =
  | 'habit'
  | 'workout'
  | 'task'
  | 'transaction'
  | 'goal'
  | 'achievement'
  | 'streak'
  | 'onboarding'
  | 'bonus'
  | 'health'

export interface GrantXpResult {
  xpEarned: number
  xpTotalAfter: number
  newLevel: number
  leveledUp: boolean
  previousLevel: number
  achievementsUnlocked: string[]
}
