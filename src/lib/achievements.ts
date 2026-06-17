/**
 * Metadata de conquistas — fonte única da verdade.
 *
 * Compartilhado entre:
 * - achievement-toast.tsx (toast de conquistas comuns/raras)
 * - achievement-share-modal.tsx (modal de celebração para épicas/lendárias)
 * - api/og/achievement/route.tsx (card OG compartilhável)
 *
 * Mantido em sincronia com a tabela `achievements` do banco.
 */

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AchievementMeta {
  name: string;
  emoji: string;
  xp: number;
  rarity: Rarity;
}

export const ACHIEVEMENT_MAP: Record<string, AchievementMeta> = {
  // Hábitos
  first_habit: { name: 'Primeiro Passo', emoji: '🎯', xp: 50, rarity: 'common' },
  habits_100: { name: '100 Hábitos', emoji: '💪', xp: 200, rarity: 'rare' },
  habits_500: { name: '500 Hábitos', emoji: '⚡', xp: 500, rarity: 'epic' },
  habits_1000: { name: '1.000 Hábitos', emoji: '🏆', xp: 1000, rarity: 'legendary' },
  perfect_day: { name: 'Dia Perfeito', emoji: '⭐', xp: 100, rarity: 'rare' },
  perfect_week: { name: 'Semana Perfeita', emoji: '🌟', xp: 300, rarity: 'epic' },
  // Tarefas
  first_task: { name: 'Primeira Tarefa', emoji: '✅', xp: 30, rarity: 'common' },
  tasks_50: { name: '50 Tarefas', emoji: '🎖️', xp: 150, rarity: 'rare' },
  tasks_200: { name: '200 Tarefas', emoji: '🏅', xp: 400, rarity: 'epic' },
  first_subtask: { name: 'Subtarefa', emoji: '📋', xp: 20, rarity: 'common' },
  subtasks_50: { name: '50 Subtarefas', emoji: '📊', xp: 100, rarity: 'rare' },
  // Treinos
  first_workout: { name: 'Primeiro Treino', emoji: '🏋️', xp: 100, rarity: 'common' },
  workouts_10: { name: '10 Treinos', emoji: '💪', xp: 200, rarity: 'rare' },
  workouts_50: { name: '50 Treinos', emoji: '🥇', xp: 500, rarity: 'epic' },
  first_pr: { name: 'Primeiro PR', emoji: '🔥', xp: 150, rarity: 'rare' },
  // Finanças
  first_transaction: { name: 'Primeiro Registro', emoji: '💰', xp: 20, rarity: 'common' },
  transactions_50: { name: '50 Registros', emoji: '📈', xp: 100, rarity: 'rare' },
  finance_goal_completed: { name: 'Meta Financeira', emoji: '🎯', xp: 500, rarity: 'epic' },
  finance_goals_3: { name: '3 Metas Financeiras', emoji: '💎', xp: 200, rarity: 'rare' },
  // Metas
  first_goal: { name: 'Primeira Meta', emoji: '🎯', xp: 50, rarity: 'common' },
  goals_5: { name: '5 Metas Concluídas', emoji: '🏆', xp: 300, rarity: 'epic' },
  // Saúde
  first_mood_checkin: { name: 'Check-in de Humor', emoji: '😊', xp: 20, rarity: 'common' },
  first_sleep_log: { name: 'Primeiro Sono', emoji: '😴', xp: 20, rarity: 'common' },
  first_water_goal: { name: '2L de Água', emoji: '💧', xp: 50, rarity: 'common' },
  water_goal_7: { name: '7 Dias Hidratado', emoji: '🌊', xp: 200, rarity: 'rare' },
  // Nível
  level_2: { name: 'Nível 2 — Dedicado', emoji: '🥉', xp: 0, rarity: 'common' },
  level_3: { name: 'Nível 3 — Consistente', emoji: '🥈', xp: 0, rarity: 'rare' },
  level_4: { name: 'Nível 4 — Atleta', emoji: '🥇', xp: 0, rarity: 'rare' },
  level_5: { name: 'Nível 5 — Guerreiro', emoji: '⚔️', xp: 0, rarity: 'epic' },
  level_6: { name: 'Nível 6 — Elite', emoji: '🛡️', xp: 0, rarity: 'epic' },
  level_7: { name: 'Nível 7 — Lendário', emoji: '🏛️', xp: 0, rarity: 'legendary' },
  level_8: { name: 'Ascendia Master', emoji: '👑', xp: 0, rarity: 'legendary' },
};

export const RARITY_STYLE: Record<
  Rarity,
  { color: string; rgb: string; border: string; label: string }
> = {
  common: { color: '#8899BB', rgb: '136,153,187', border: 'rgba(136,153,187,0.4)', label: 'Conquista' },
  rare: { color: '#3B82F6', rgb: '59,130,246', border: 'rgba(59,130,246,0.5)', label: 'Raro' },
  epic: { color: '#7C3AED', rgb: '124,58,237', border: 'rgba(124,58,237,0.55)', label: 'Épico' },
  legendary: { color: '#F5C842', rgb: '245,200,66', border: 'rgba(245,200,66,0.6)', label: 'Lendário' },
};

/** Raridades que merecem o modal de celebração + compartilhamento (alto impacto). */
export function isShareWorthy(rarity: Rarity): boolean {
  return rarity === 'epic' || rarity === 'legendary';
}
