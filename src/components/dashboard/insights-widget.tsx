'use client';

import { useEffect, useState } from 'react';
import {
  Lightbulb,
  Flame,
  Zap,
  AlertTriangle,
  Trophy,
  Target,
  TrendingUp,
  Star,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface InsightData {
  habitsTotal: number;
  habitsCompleted: number;
  streakCurrent: number;
  streakLongest: number;
  xpTotal: number;
  xpToNextLevel: number;
  level: number;
  criticalTasks: number;
  totalTasks: number;
  xpToday: number;
  upcomingBills: number;
  perfectDays: number;
}

interface Insight {
  id: string;
  icon: typeof Lightbulb;
  title: string;
  message: string;
  type: 'warning' | 'success' | 'info' | 'challenge';
  rgb: string;
  emoji: string;
  cta?: string;
  ctaHref?: string;
  priority: number;
}

// ─── Insight computation ─────────────────────────────────────────────────────

function computeInsights(data: InsightData): Insight[] {
  const insights: Insight[] = [];

  const {
    habitsTotal,
    habitsCompleted,
    streakCurrent,
    streakLongest,
    xpTotal,
    xpToNextLevel,
    level,
    criticalTasks,
    totalTasks,
    xpToday,
    upcomingBills,
    perfectDays,
  } = data;

  const habitsRemaining = habitsTotal - habitsCompleted;
  const isPerfectDay = habitsTotal > 0 && habitsCompleted === habitsTotal;

  // ── Perigo de quebrar streak ──────────────────────────────────────────────
  if (streakCurrent >= 3 && habitsCompleted === 0 && habitsTotal > 0) {
    insights.push({
      id: 'streak_risk',
      icon: Flame,
      title: 'Sua sequência está em risco!',
      message: `Você tem ${streakCurrent} dias consecutivos — não quebre agora. Registre pelo menos 1 hábito hoje.`,
      type: 'warning',
      rgb: '255,77,0',
      emoji: '🔥',
      cta: 'Registrar hábito',
      ctaHref: '/habitos',
      priority: 10,
    });
  }

  // ── Dia perfeito quase lá ──────────────────────────────────────────────────
  if (habitsRemaining > 0 && habitsRemaining <= 2 && habitsCompleted > 0) {
    insights.push({
      id: 'perfect_day_close',
      icon: Star,
      title: `Só falt${habitsRemaining === 1 ? 'a' : 'am'} ${habitsRemaining} hábito${habitsRemaining > 1 ? 's' : ''}!`,
      message: `Complete mais ${habitsRemaining} hábito${habitsRemaining > 1 ? 's' : ''} para ganhar o bônus de Dia Perfeito: +200 XP extra!`,
      type: 'challenge',
      rgb: '245,200,66',
      emoji: '⭐',
      cta: 'Ver hábitos',
      ctaHref: '/habitos',
      priority: 9,
    });
  }

  // ── Dia perfeito conseguido ──────────────────────────────────────────────
  if (isPerfectDay) {
    insights.push({
      id: 'perfect_day_done',
      icon: CheckCircle2,
      title: 'Dia perfeito! 🏆',
      message: `Todos os ${habitsTotal} hábitos concluídos. Você é imparável. Bônus de +200 XP desbloqueado!`,
      type: 'success',
      rgb: '0,255,136',
      emoji: '✅',
      priority: 8,
    });
  }

  // ── Nível prestes a subir ─────────────────────────────────────────────────
  if (xpToNextLevel > 0 && xpToNextLevel <= 200) {
    insights.push({
      id: 'level_close',
      icon: Zap,
      title: `Quase no nível ${level + 1}!`,
      message: `Faltam apenas ${xpToNextLevel} XP para subir de nível. Registre hábitos ou complete tarefas para chegar lá!`,
      type: 'challenge',
      rgb: '124,58,237',
      emoji: '⚡',
      priority: 7,
    });
  }

  // ── Novo recorde de streak ────────────────────────────────────────────────
  if (streakCurrent > 0 && streakCurrent === streakLongest && streakCurrent >= 7) {
    insights.push({
      id: 'streak_record',
      icon: Trophy,
      title: 'Recorde pessoal de sequência!',
      message: `${streakCurrent} dias consecutivos — este é seu melhor streak de todos os tempos! Continue assim.`,
      type: 'success',
      rgb: '245,200,66',
      emoji: '🏆',
      priority: 6,
    });
  }

  // ── Tarefas críticas ──────────────────────────────────────────────────────
  if (criticalTasks >= 3) {
    insights.push({
      id: 'critical_tasks',
      icon: AlertTriangle,
      title: `${criticalTasks} tarefas críticas acumuladas`,
      message:
        'Tarefas urgentes + importantes afetam seu Life Score. Resolva ao menos 1 hoje para manter seu Score alto.',
      type: 'warning',
      rgb: '239,68,68',
      emoji: '⚠️',
      cta: 'Ver tarefas',
      ctaHref: '/tarefas',
      priority: 5,
    });
  }

  // ── XP hoje está bem ─────────────────────────────────────────────────────
  if (xpToday >= 200 && xpToday < 500) {
    insights.push({
      id: 'xp_good_day',
      icon: TrendingUp,
      title: `+${xpToday} XP hoje — bom ritmo!`,
      message:
        'Você está tendo um bom dia de evolução. Continue registrando atividades para maximizar o XP.',
      type: 'info',
      rgb: '0,255,136',
      emoji: '📈',
      priority: 4,
    });
  }

  // ── XP hoje está ótimo ────────────────────────────────────────────────────
  if (xpToday >= 500) {
    insights.push({
      id: 'xp_great_day',
      icon: Zap,
      title: `+${xpToday} XP hoje — dia épico!`,
      message:
        'Você está arrasando! Este vai ser um dos seus melhores dias de XP. Só mais um pouquinho para bater a meta de 500 XP.',
      type: 'success',
      rgb: '245,200,66',
      emoji: '🔥',
      priority: 5,
    });
  }

  // ── Contas a vencer ───────────────────────────────────────────────────────
  if (upcomingBills > 0) {
    insights.push({
      id: 'upcoming_bills',
      icon: Clock,
      title: `${upcomingBills} conta${upcomingBills > 1 ? 's' : ''} vencendo em breve`,
      message:
        'Não deixe atrasar — contas pagas no prazo concedem XP Finanças e mantêm sua saúde financeira.',
      type: 'warning',
      rgb: '255,77,0',
      emoji: '💳',
      cta: 'Ver finanças',
      ctaHref: '/financas',
      priority: 4,
    });
  }

  // ── Nenhum hábito hoje (mas sem streak em risco) ──────────────────────────
  if (habitsTotal > 0 && habitsCompleted === 0 && streakCurrent < 3) {
    insights.push({
      id: 'start_day',
      icon: Target,
      title: 'Vamos começar o dia?',
      message: `Você tem ${habitsTotal} hábito${habitsTotal > 1 ? 's' : ''} para hoje. Cada check vale +50 XP e mantém sua sequência viva.`,
      type: 'info',
      rgb: '124,58,237',
      emoji: '🎯',
      cta: 'Registrar hábito',
      ctaHref: '/habitos',
      priority: 3,
    });
  }

  // ── Sem hábitos cadastrados ───────────────────────────────────────────────
  if (habitsTotal === 0) {
    insights.push({
      id: 'no_habits',
      icon: Sparkles,
      title: 'Configure seus hábitos',
      message:
        'Hábitos são a base do sistema. Crie pelo menos 3 hoje para começar a acumular XP e streak diário.',
      type: 'info',
      rgb: '124,58,237',
      emoji: '✨',
      cta: 'Criar hábito',
      ctaHref: '/habitos',
      priority: 2,
    });
  }

  // ── Marcos de XP ─────────────────────────────────────────────────────────
  const xpMilestones = [1000, 5000, 10000, 25000, 50000];
  for (const milestone of xpMilestones) {
    if (xpTotal >= milestone * 0.95 && xpTotal < milestone) {
      const remaining = milestone - xpTotal;
      insights.push({
        id: `xp_milestone_${milestone}`,
        icon: Star,
        title: `Quase em ${milestone.toLocaleString('pt-BR')} XP!`,
        message: `Faltam apenas ${remaining.toLocaleString('pt-BR')} XP para um marco histórico. Você consegue hoje!`,
        type: 'challenge',
        rgb: '245,200,66',
        emoji: '🌟',
        priority: 6,
      });
      break;
    }
  }

  // ── Parabéns pelos dias perfeitos ─────────────────────────────────────────
  if (perfectDays >= 1 && perfectDays % 5 === 0) {
    insights.push({
      id: `perfect_days_${perfectDays}`,
      icon: Trophy,
      title: `${perfectDays} dias perfeitos!`,
      message: `Incrível! Você já completou ${perfectDays} dias com todos os hábitos registrados. Isso é disciplina de elite!`,
      type: 'success',
      rgb: '0,255,136',
      emoji: '👑',
      priority: 5,
    });
  }

  // Ordenar por prioridade e pegar os 3 principais
  return insights.sort((a, b) => b.priority - a.priority).slice(0, 3);
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function InsightSkeleton() {
  return (
    <div
      className="animate-pulse rounded-2xl p-4"
      style={{ background: 'rgba(21,34,56,0.5)', border: '1px solid rgba(255,255,255,0.04)' }}
    >
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 shrink-0 rounded-xl bg-white/[0.06]" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-2/3 rounded-full bg-white/[0.06]" />
          <div className="h-3 w-full rounded-full bg-white/[0.04]" />
          <div className="h-3 w-4/5 rounded-full bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

// ─── InsightCard ─────────────────────────────────────────────────────────────

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const [visible, setVisible] = useState(false);
  const Icon = insight.icon;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80 + index * 120);
    return () => clearTimeout(t);
  }, [index]);

  const typeStyles = {
    warning: { bg: 'rgba(255,77,0,0.06)', border: `rgba(${insight.rgb},0.22)` },
    success: { bg: `rgba(${insight.rgb},0.06)`, border: `rgba(${insight.rgb},0.22)` },
    info: { bg: `rgba(${insight.rgb},0.05)`, border: `rgba(${insight.rgb},0.15)` },
    challenge: { bg: `rgba(${insight.rgb},0.07)`, border: `rgba(${insight.rgb},0.25)` },
  }[insight.type];

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:scale-[1.01]"
      style={{
        background: `linear-gradient(135deg, ${typeStyles.bg} 0%, rgba(13,24,41,0.97) 100%)`,
        border: `1px solid ${typeStyles.border}`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
      }}
    >
      {/* Corner glow */}
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(${insight.rgb},0.12) 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 flex items-start gap-3">
        {/* Icon badge */}
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: `rgba(${insight.rgb},0.15)`,
            border: `1px solid rgba(${insight.rgb},0.25)`,
          }}
        >
          <Icon size={14} style={{ color: `rgb(${insight.rgb})` }} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 text-sm font-semibold">{insight.title}</div>
          <p className="text-xs leading-relaxed text-text-secondary">{insight.message}</p>
          {insight.cta && insight.ctaHref && (
            <a
              href={insight.ctaHref}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ color: `rgb(${insight.rgb})` }}
            >
              {insight.cta} →
            </a>
          )}
        </div>

        {/* Emoji badge */}
        <div className="shrink-0 text-lg" style={{ lineHeight: 1 }}>
          {insight.emoji}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface InsightsWidgetProps {
  habitsTotal: number;
  habitsCompleted: number;
  streakCurrent: number;
  streakLongest: number;
  xpTotal: number;
  xpToNextLevel: number;
  level: number;
  criticalTasks: number;
  totalTasks: number;
  xpToday: number;
  upcomingBills: number;
  perfectDays: number;
}

export function InsightsWidget({
  habitsTotal,
  habitsCompleted,
  streakCurrent,
  streakLongest,
  xpTotal,
  xpToNextLevel,
  level,
  criticalTasks,
  totalTasks,
  xpToday,
  upcomingBills,
  perfectDays,
}: InsightsWidgetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const insights = computeInsights({
    habitsTotal,
    habitsCompleted,
    streakCurrent,
    streakLongest,
    xpTotal,
    xpToNextLevel,
    level,
    criticalTasks,
    totalTasks,
    xpToday,
    upcomingBills,
    perfectDays,
  });

  if (insights.length === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background:
          'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.04) 100%)',
        border: '1px solid rgba(124,58,237,0.15)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
      }}
    >
      {/* Ambient glow top-right */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)' }}
      />
      {/* Ambient glow bottom-left */}
      <div
        className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,77,0,0.06) 0%, transparent 70%)' }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-4 flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}
          >
            <Lightbulb size={13} style={{ color: '#9F5AF7' }} />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-text-secondary">
            Insights de hoje
          </h2>
          <span
            className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{
              background: 'rgba(124,58,237,0.15)',
              color: '#9F5AF7',
              border: '1px solid rgba(124,58,237,0.25)',
            }}
          >
            {insights.length} insight{insights.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Insights */}
        <div className="space-y-2.5">
          {!mounted
            ? insights.map((_, i) => <InsightSkeleton key={i} />)
            : insights.map((insight, i) => (
                <InsightCard key={insight.id} insight={insight} index={i} />
              ))}
        </div>
      </div>
    </div>
  );
}
