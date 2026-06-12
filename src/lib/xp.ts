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
  FINANCE_STREAK_7: 150, // 7 dias registrando transações
  FINANCE_STREAK_30: 500, // 30 dias

  // Streak
  STREAK_3_DAYS: 100,
  STREAK_7_DAYS: 300,
  STREAK_30_DAYS: 1000,
  STREAK_90_DAYS: 3000,

  // Login diário
  LOGIN_DAY_1: 20,
  LOGIN_DAY_2: 30,
  LOGIN_DAY_3: 50,
  LOGIN_DAY_4: 75,
  LOGIN_DAY_5: 100,
  LOGIN_DAY_6: 150,
  LOGIN_DAY_7: 300, // + loot box

  // Metas
  GOAL_COMPLETED: 200,

  // Outros
  ONBOARDING_COMPLETED: 100,
  FIRST_TIME_BONUS: 100,

  // Season (separados — não contam para XP normal, usados só em season_progress)
  SEASON_HABIT: 10,
  SEASON_PERFECT_DAY: 50,
  SEASON_WORKOUT: 20,
  SEASON_TASK: 5,
  SEASON_TRANSACTION: 2,
} as const;

// ════════ LOGIN STREAK REWARDS ════════
export const LOGIN_STREAK_REWARDS: Record<number, number> = {
  1: XP_REWARDS.LOGIN_DAY_1,
  2: XP_REWARDS.LOGIN_DAY_2,
  3: XP_REWARDS.LOGIN_DAY_3,
  4: XP_REWARDS.LOGIN_DAY_4,
  5: XP_REWARDS.LOGIN_DAY_5,
  6: XP_REWARDS.LOGIN_DAY_6,
  7: XP_REWARDS.LOGIN_DAY_7,
};

export function getLoginReward(dayInCycle: number): number {
  // Ciclo de 7 dias: dia 1-7, depois recomeça
  const day = ((dayInCycle - 1) % 7) + 1;
  return LOGIN_STREAK_REWARDS[day] ?? XP_REWARDS.LOGIN_DAY_1;
}

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
] as const;

// ════════ PRESTIGE ════════
export const PRESTIGE_THRESHOLDS = [
  35_000, // Prestige 1 — Ascendido ⭐
  70_000, // Prestige 2
  120_000, // Prestige 3 — Diamante 💎
  200_000, // Prestige 4
  350_000, // Prestige 5 — Imortal 🔥
  500_000, // Prestige 6
  750_000, // Prestige 7
  1_000_000, // Prestige 8
  1_500_000, // Prestige 9
  2_500_000, // Prestige 10 — Lendário Eterno 👑
] as const;

export const PRESTIGE_INFO = [
  { level: 0, title: '', emoji: '', cosmetic_slug: null },
  { level: 1, title: 'Ascendido', emoji: '⭐', cosmetic_slug: 'title_ascendido' },
  { level: 2, title: 'Ascendido II', emoji: '⭐', cosmetic_slug: null },
  { level: 3, title: 'Diamante', emoji: '💎', cosmetic_slug: 'title_diamante' },
  { level: 4, title: 'Diamante II', emoji: '💎', cosmetic_slug: null },
  { level: 5, title: 'Imortal', emoji: '🔥', cosmetic_slug: 'title_imortal' },
  { level: 6, title: 'Imortal II', emoji: '🔥', cosmetic_slug: null },
  { level: 7, title: 'Imortal III', emoji: '🔥', cosmetic_slug: null },
  { level: 8, title: 'Lendário', emoji: '👑', cosmetic_slug: null },
  { level: 9, title: 'Lendário II', emoji: '👑', cosmetic_slug: null },
  { level: 10, title: 'Lendário Eterno', emoji: '👑', cosmetic_slug: 'title_lendario_eterno' },
] as const;

export function calculatePrestige(xpAllTime: number): number {
  let prestige = 0;
  for (const threshold of PRESTIGE_THRESHOLDS) {
    if (xpAllTime >= threshold) prestige++;
    else break;
  }
  return prestige;
}

export function getPrestigeInfo(prestigeLevel: number) {
  return PRESTIGE_INFO.find((p) => p.level === prestigeLevel) ?? PRESTIGE_INFO[0]!;
}

export function getNextPrestigeThreshold(xpAllTime: number): number | null {
  for (const threshold of PRESTIGE_THRESHOLDS) {
    if (xpAllTime < threshold) return threshold;
  }
  return null;
}

// ════════ LEAGUE DIVISIONS ════════
export const LEAGUE_DIVISIONS = [
  { name: 'Diamante', color: '#00D9FF', rgb: '0,217,255', emoji: '💎', minPct: 97 },
  { name: 'Platina', color: '#7C3AED', rgb: '124,58,237', emoji: '🏆', minPct: 90 },
  { name: 'Ouro', color: '#F5C842', rgb: '245,200,66', emoji: '🥇', minPct: 75 },
  { name: 'Prata', color: '#8899BB', rgb: '136,153,187', emoji: '🥈', minPct: 50 },
  { name: 'Bronze', color: '#CD7F32', rgb: '205,127,50', emoji: '🥉', minPct: 0 },
] as const;

export function getLeagueDivision(position: number, totalPlayers: number) {
  if (totalPlayers === 0) return LEAGUE_DIVISIONS[4]!; // Bronze
  const pct = ((totalPlayers - position) / totalPlayers) * 100;
  return LEAGUE_DIVISIONS.find((d) => pct >= d.minPct) ?? LEAGUE_DIVISIONS[4]!;
}

// ════════ LEVEL FUNCTIONS ════════

export function calculateLevel(xp: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i]!.minXp) return LEVELS[i]!.level;
  }
  return 1;
}

export function getLevelInfo(level: number) {
  return LEVELS.find((l) => l.level === level) ?? LEVELS[0]!;
}

export function getXpProgressToNextLevel(xp: number): {
  current: number;
  needed: number;
  percentage: number;
} {
  const level = calculateLevel(xp);
  const info = getLevelInfo(level);
  if (info.maxXp === Infinity) {
    return { current: xp - info.minXp, needed: 0, percentage: 100 };
  }
  const current = xp - info.minXp;
  const needed = info.maxXp - info.minXp;
  const percentage = Math.min(100, Math.round((current / needed) * 100));
  return { current, needed, percentage };
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
  | 'login'
  | 'loot'
  | 'season';

export interface GrantXpResult {
  xpEarned: number;
  xpTotalAfter: number;
  newLevel: number;
  leveledUp: boolean;
  previousLevel: number;
  achievementsUnlocked: string[];
  newPrestige?: number;
}
