/**
 * Utilitários de data e semana do Ascendia.
 *
 * Antes deste módulo, getWeekStart() e getISOWeek() estavam duplicadas em
 * pelo menos 4 arquivos com implementações ligeiramente diferentes
 * (uma retornava string, outra Date — inconsistência silenciosa).
 *
 * Todas as funções são puras (sem side effects) e timezone-aware.
 */

import { DEFAULT_TIMEZONE, MS_PER_DAY } from '@/lib/constants';

/**
 * Retorna o número da semana ISO (1-53) para uma data.
 * Semanas ISO começam na segunda-feira.
 */
export function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / MS_PER_DAY + 1) / 7);
}

/**
 * Retorna a segunda-feira da semana de uma data no formato YYYY-MM-DD.
 * Usa UTC internamente para consistência com strings de banco de dados.
 */
export function getWeekStartString(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return d.toISOString().split('T')[0]!;
}

/**
 * Retorna o domingo da semana de uma data no formato YYYY-MM-DD.
 */
export function getWeekEndString(date: Date): string {
  const start = new Date(getWeekStartString(date) + 'T00:00:00Z');
  start.setDate(start.getDate() + 6);
  return start.toISOString().split('T')[0]!;
}

/**
 * Retorna quantos dias restam na semana atual (mínimo 1).
 */
export function getDaysLeftInWeek(date: Date = new Date()): number {
  const end = new Date(getWeekEndString(date) + 'T23:59:59Z');
  return Math.max(1, Math.ceil((end.getTime() - date.getTime()) / MS_PER_DAY));
}

/**
 * Retorna o início do mês atual no formato YYYY-MM-01.
 */
export function getMonthStartString(date: Date = new Date()): string {
  return date.toISOString().substring(0, 7) + '-01';
}

/**
 * Retorna uma data N dias no passado.
 */
export function daysAgo(n: number, from: Date = new Date()): Date {
  return new Date(from.getTime() - n * MS_PER_DAY);
}

/**
 * Retorna o timestamp de N dias atrás como string ISO.
 */
export function daysAgoISO(n: number, from: Date = new Date()): string {
  return daysAgo(n, from).toISOString();
}

/**
 * Formata uma data como YYYY-MM-DD no timezone especificado.
 * Substitui o padrão `date.toISOString().split('T')[0]` (que usa UTC).
 */
export function toDateString(date: Date, timezone = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(date);
}

/**
 * Retorna a data de ontem como YYYY-MM-DD no timezone especificado.
 */
export function yesterdayString(timezone = DEFAULT_TIMEZONE): string {
  return toDateString(daysAgo(1), timezone);
}
