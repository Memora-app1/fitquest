'use client';

import { useEffect, useRef, useState } from 'react';
import { Zap, Flame, Activity, ArrowRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface XpTransaction {
  id: string;
  amount: number;
  reason: string;
  source_type: string;
  created_at: string;
}

// ─── Source config ────────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<
  string,
  { icon: string; color: string; rgb: string; label: string; href?: string }
> = {
  habit: { icon: '🎯', color: '#FF4D00', rgb: '255,77,0', label: 'Hábito', href: '/habitos' },
  workout: { icon: '💪', color: '#00FF88', rgb: '0,255,136', label: 'Treino', href: '/treinos' },
  task: { icon: '✅', color: '#7C3AED', rgb: '124,58,237', label: 'Tarefa', href: '/tarefas' },
  health: { icon: '💧', color: '#00D9FF', rgb: '0,217,255', label: 'Saúde', href: '/saude' },
  goal: { icon: '🎯', color: '#3B82F6', rgb: '59,130,246', label: 'Meta', href: '/metas' },
  streak: { icon: '🔥', color: '#FF4D00', rgb: '255,77,0', label: 'Streak' },
  bonus: { icon: '⭐', color: '#F5C842', rgb: '245,200,66', label: 'Bônus' },
  achievement: {
    icon: '🏆',
    color: '#F5C842',
    rgb: '245,200,66',
    label: 'Conquista',
    href: '/conquistas',
  },
  finance_goal: {
    icon: '💰',
    color: '#00FF88',
    rgb: '0,255,136',
    label: 'Meta fin.',
    href: '/financas/metas',
  },
  transaction: {
    icon: '💳',
    color: '#3B82F6',
    rgb: '59,130,246',
    label: 'Finanças',
    href: '/financas',
  },
  onboarding: { icon: '🚀', color: '#7C3AED', rgb: '124,58,237', label: 'Onboarding' },
  system: { icon: '⚡', color: '#F5C842', rgb: '245,200,66', label: 'Sistema' },
};

function getSourceCfg(type: string) {
  return SOURCE_CONFIG[type] ?? SOURCE_CONFIG.system!;
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  if (hours < 24) return `${hours}h atrás`;
  if (days === 1) return 'ontem';
  return `${days}d atrás`;
}

function isRecent(date: string, minutes = 30): boolean {
  return Date.now() - new Date(date).getTime() < minutes * 60000;
}

type GroupKey = 'hoje' | 'ontem' | 'mais_antigo';

function getGroupKey(date: string): GroupKey {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 86400000) return 'hoje';
  if (diff < 172800000) return 'ontem';
  return 'mais_antigo';
}

const GROUP_LABELS: Record<GroupKey, string> = {
  hoje: 'Hoje',
  ontem: 'Ontem',
  mais_antigo: 'Mais antigo',
};

// ─── Source Breakdown Chip ────────────────────────────────────────────────────

function BreakdownChip({ type, xp, count }: { type: string; xp: number; count: number }) {
  const cfg = getSourceCfg(type);
  return (
    <div
      className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-medium"
      style={{
        background: `rgba(${cfg.rgb},0.1)`,
        border: `1px solid rgba(${cfg.rgb},0.2)`,
      }}
    >
      <span>{cfg.icon}</span>
      <span style={{ color: cfg.color }}>{cfg.label}</span>
      <span className="text-text-muted">·</span>
      <span className="font-bold text-brand-gold">+{xp}</span>
      {count > 1 && <span className="text-text-muted">({count}x)</span>}
    </div>
  );
}

// ─── Timeline Entry ───────────────────────────────────────────────────────────

function TimelineEntry({
  tx,
  index,
  isLast,
  groupVisible,
}: {
  tx: XpTransaction;
  index: number;
  isLast: boolean;
  groupVisible: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const cfg = getSourceCfg(tx.source_type);
  const fresh = isRecent(tx.created_at, 30);

  useEffect(() => {
    if (!groupVisible) return;
    const t = setTimeout(() => setVisible(true), 40 + index * 70);
    return () => clearTimeout(t);
  }, [groupVisible, index]);

  return (
    <div
      className="flex items-start gap-0 transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(12px)',
      }}
    >
      {/* Timeline stem + dot */}
      <div className="mr-3 flex shrink-0 flex-col items-center" style={{ width: 20 }}>
        <div
          className="z-10 mt-1 h-3 w-3 shrink-0 rounded-full"
          style={{
            background: cfg.color,
            boxShadow: `0 0 6px ${cfg.color}60`,
            border: `2px solid rgba(${cfg.rgb},0.3)`,
          }}
        />
        {!isLast && (
          <div
            className="mt-1 flex-1"
            style={{ width: 1.5, minHeight: 24, background: 'rgba(255,255,255,0.06)' }}
          />
        )}
      </div>

      {/* Entry card */}
      <div className="group flex flex-1 cursor-default items-start gap-3 pb-4">
        {/* Icon */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base transition-transform group-hover:scale-105"
          style={{
            background: `rgba(${cfg.rgb},0.12)`,
            border: `1px solid rgba(${cfg.rgb},0.22)`,
          }}
        >
          {cfg.icon}
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="max-w-[200px] truncate text-sm font-medium leading-tight">
              {tx.reason}
            </span>
            {fresh && (
              <span
                className="flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                style={{
                  background: 'rgba(0,255,136,0.15)',
                  color: '#00FF88',
                  border: '1px solid rgba(0,255,136,0.25)',
                }}
              >
                <span className="inline-block h-1 w-1 animate-pulse rounded-full bg-brand-green" />
                novo
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: `rgba(${cfg.rgb},0.12)`,
                color: cfg.color,
                border: `1px solid rgba(${cfg.rgb},0.18)`,
              }}
            >
              {cfg.label}
            </span>
            <span className="text-[10px] text-text-muted">{timeAgo(tx.created_at)}</span>
          </div>
        </div>

        {/* XP pill */}
        <div
          className="flex shrink-0 items-center gap-0.5 rounded-lg px-2 py-1 text-sm font-black transition-all group-hover:scale-105"
          style={{
            background: 'rgba(245,200,66,0.1)',
            border: '1px solid rgba(245,200,66,0.18)',
            color: '#F5C842',
          }}
        >
          <Zap size={11} fill="currentColor" />+{tx.amount}
        </div>
      </div>
    </div>
  );
}

// ─── Group Section ────────────────────────────────────────────────────────────

function GroupSection({
  label,
  entries,
  sectionVisible,
  baseIndex,
}: {
  label: string;
  entries: XpTransaction[];
  sectionVisible: boolean;
  baseIndex: number;
}) {
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    if (!sectionVisible) return;
    const t = setTimeout(() => setHeaderVisible(true), 20);
    return () => clearTimeout(t);
  }, [sectionVisible]);

  return (
    <div className="space-y-0">
      {/* Group label */}
      <div
        className="mb-3 flex items-center gap-2 transition-all duration-300"
        style={{
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? 'translateY(0)' : 'translateY(-4px)',
        }}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          {label}
        </span>
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <span className="text-[10px] text-text-muted">{entries.length}</span>
      </div>

      {/* Entries */}
      <div>
        {entries.map((tx, i) => (
          <TimelineEntry
            key={tx.id}
            tx={tx}
            index={baseIndex + i}
            isLast={i === entries.length - 1}
            groupVisible={sectionVisible}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Animated Total ───────────────────────────────────────────────────────────

function AnimatedTotal({ target }: { target: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 1000;
    const raf = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(raf);
    };
    const id = requestAnimationFrame(raf);
    return () => cancelAnimationFrame(id);
  }, [target]);

  return <>{value.toLocaleString('pt-BR')}</>;
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  const CTALINKS = [
    { label: 'Registrar hábito', href: '/habitos', color: '#FF4D00', rgb: '255,77,0', emoji: '🎯' },
    {
      label: 'Completar tarefa',
      href: '/tarefas',
      color: '#7C3AED',
      rgb: '124,58,237',
      emoji: '✅',
    },
    { label: 'Iniciar treino', href: '/treinos', color: '#00FF88', rgb: '0,255,136', emoji: '💪' },
  ];

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(245,200,66,0.05) 0%, rgba(13,24,41,0.98) 100%)',
        border: '1px solid rgba(245,200,66,0.15)',
      }}
    >
      {/* Header */}
      <div className="mb-5 flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.25)' }}
        >
          <Activity size={13} style={{ color: '#F5C842' }} />
        </div>
        <h2 className="text-sm font-bold">Atividade Recente</h2>
      </div>

      <div className="space-y-4 py-6 text-center">
        <div className="text-5xl">🌱</div>
        <div>
          <p className="text-sm font-semibold text-text-secondary">Nenhuma atividade ainda</p>
          <p className="mt-1 text-xs text-text-muted">
            Cada ação concede XP e aparece aqui em tempo real
          </p>
        </div>
        <div className="mx-auto flex max-w-xs flex-col gap-2">
          {CTALINKS.map((cta) => (
            <a
              key={cta.href}
              href={cta.href}
              className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:scale-[1.02]"
              style={{
                background: `rgba(${cta.rgb},0.08)`,
                border: `1px solid rgba(${cta.rgb},0.18)`,
                color: cta.color,
              }}
            >
              <span>
                {cta.emoji} {cta.label}
              </span>
              <ArrowRight size={13} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ActivityFeed({ transactions }: { transactions: XpTransaction[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  if (transactions.length === 0) return <EmptyState />;

  const totalXp = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const hasLive = transactions.some((t) => isRecent(t.created_at, 30));

  // Group by time
  const groups: Record<GroupKey, XpTransaction[]> = { hoje: [], ontem: [], mais_antigo: [] };
  for (const tx of transactions) {
    groups[getGroupKey(tx.created_at)].push(tx);
  }
  const orderedGroups: GroupKey[] = ['hoje', 'ontem', 'mais_antigo'];

  // Source breakdown (aggregate XP + count by source_type)
  const breakdown: Record<string, { xp: number; count: number }> = {};
  for (const tx of transactions) {
    if (!breakdown[tx.source_type]) breakdown[tx.source_type] = { xp: 0, count: 0 };
    breakdown[tx.source_type]!.xp += tx.amount;
    breakdown[tx.source_type]!.count += 1;
  }
  const breakdownEntries = Object.entries(breakdown).sort(([, a], [, b]) => b.xp - a.xp);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-2xl p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(245,200,66,0.06) 0%, rgba(13,24,41,0.98) 100%)',
        border: '1px solid rgba(245,200,66,0.15)',
      }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(245,200,66,0.08) 0%, transparent 70%)' }}
      />

      <div className="relative z-10">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{
                background: 'rgba(245,200,66,0.15)',
                border: '1px solid rgba(245,200,66,0.25)',
              }}
            >
              <Activity size={13} style={{ color: '#F5C842' }} />
            </div>
            <h2 className="font-bold">Atividade Recente</h2>

            {/* Live badge */}
            {hasLive && (
              <div
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                style={{
                  background: 'rgba(0,255,136,0.12)',
                  color: '#00FF88',
                  border: '1px solid rgba(0,255,136,0.22)',
                }}
              >
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-brand-green" />
                ao vivo
              </div>
            )}
          </div>

          {/* Total XP pill */}
          <div
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
            style={{
              background: 'rgba(245,200,66,0.12)',
              border: '1px solid rgba(245,200,66,0.25)',
            }}
          >
            <Zap size={12} fill="currentColor" style={{ color: '#F5C842' }} />
            <span className="text-sm font-black" style={{ color: '#F5C842' }}>
              +{visible ? <AnimatedTotal target={totalXp} /> : 0}
            </span>
            <span className="text-[10px] text-text-muted">XP</span>
          </div>
        </div>

        {/* ── Source breakdown chips ───────────────────────────────────────── */}
        {breakdownEntries.length > 1 && (
          <div className="mb-5 flex flex-wrap gap-1.5">
            {breakdownEntries.map(([type, { xp, count }]) => (
              <BreakdownChip key={type} type={type} xp={xp} count={count} />
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="mb-4" style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

        {/* ── Timeline groups ──────────────────────────────────────────────── */}
        <div className="space-y-4">
          {orderedGroups.map((key, gi) => {
            const entries = groups[key];
            if (entries.length === 0) return null;
            const baseIndex = orderedGroups
              .slice(0, gi)
              .reduce((sum, k) => sum + groups[k].length, 0);
            return (
              <GroupSection
                key={key}
                label={GROUP_LABELS[key]}
                entries={entries}
                sectionVisible={visible}
                baseIndex={baseIndex}
              />
            );
          })}
        </div>

        {/* ── Footer: period note ──────────────────────────────────────────── */}
        {transactions.length >= 20 && (
          <div
            className="mt-3 pt-3 text-center"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
          >
            <p className="text-xs text-text-muted">
              Últimas {transactions.length} atividades · 48h
            </p>
          </div>
        )}
        {transactions.length < 20 && (
          <div
            className="mt-3 pt-3 text-center text-xs text-text-muted"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
          >
            {transactions.length} atividade{transactions.length !== 1 ? 's' : ''} nas últimas 48h
          </div>
        )}
      </div>
    </div>
  );
}
