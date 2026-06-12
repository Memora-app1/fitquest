/**
 * Constantes de domínio do Ascendia.
 *
 * Centralizadas aqui para evitar duplicação e garantir consistência.
 * Antes desta centralização, WATER_GOAL_ML estava definida em 13 arquivos
 * e SLEEP_GOAL_H divergia entre componentes (8h vs 7h — bug real).
 *
 * Regra: qualquer valor de negócio usado em >1 lugar vive aqui.
 */

// ════════ SAÚDE ════════

/** Meta diária de hidratação (ml). Referência: OMS 2L/dia. */
export const WATER_GOAL_ML = 2000;

/** Meta diária de sono (horas). Referência: National Sleep Foundation. */
export const SLEEP_GOAL_H = 8;

/** Score mínimo de recovery para considerar o dia como "bom" (0-100). */
export const RECOVERY_GOOD_THRESHOLD = 75;

/** Score mínimo para "ok" (abaixo = ruim). */
export const RECOVERY_OK_THRESHOLD = 50;

// ════════ TEMPO ════════

/** Milissegundos em 1 dia. Substitui o magic number 86400000 espalhado no código. */
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Timezone padrão dos usuários (90% brasileiros). */
export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

// ════════ PAGINAÇÃO ════════

/** Itens por página padrão nas listagens. */
export const DEFAULT_PAGE_SIZE = 50;

// ════════ LIMITES DE CONTEÚDO ════════

/** Máximo de hábitos ativos por usuário. */
export const MAX_ACTIVE_HABITS = 10;

/** Máximo de mensagens do Coach por dia (custo Anthropic). */
export const DAILY_COACH_MESSAGE_LIMIT = 50;

/** Máximo de streak freezes que um usuário pode ter. */
export const MAX_STREAK_FREEZES = 10;
