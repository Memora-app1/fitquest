import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina classes Tailwind com merge inteligente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata número como moeda BRL
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formata data como "DD/MM/YYYY"
 */
export function formatDateBR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR')
}

/**
 * Formata data como "Hoje", "Ontem", "Há 2 dias" ou "DD/MM"
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `Há ${diffDays} dias`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

/**
 * Retorna saudação baseada no horário atual
 */
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return 'Boa madrugada'
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

/**
 * Calcula a porcentagem de progresso (0-100)
 */
export function calcPercentage(current: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

/**
 * Data de hoje em formato YYYY-MM-DD no timezone correto.
 * Padrão: America/Sao_Paulo (90% dos usuários).
 * toISOString() era UTC — causava data errada após 21h Brasília (UTC-3 → dia seguinte em UTC).
 */
export function todayString(timezone = 'America/Sao_Paulo'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
}

/**
 * Sleep helper para debounce/testes
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
