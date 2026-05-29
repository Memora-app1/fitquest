'use client'

import { useEffect, useRef, useState } from 'react'
import { Zap, Flame, Activity, ArrowRight } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface XpTransaction {
  id: string
  amount: number
  reason: string
  source_type: string
  created_at: string
}

// ─── Source config ────────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<string, { icon: string; color: string; rgb: string; label: string; href?: string }> = {
  habit:            { icon: '🎯', color: '#FF4D00', rgb: '255,77,0',    label: 'Hábito',      href: '/habitos' },
  workout:          { icon: '💪', color: '#00FF88', rgb: '0,255,136',   label: 'Treino',      href: '/treinos' },
  task:             { icon: '✅', color: '#7C3AED', rgb: '124,58,237',  label: 'Tarefa',      href: '/tarefas' },
  health:           { icon: '💧', color: '#00D9FF', rgb: '0,217,255',   label: 'Saúde',       href: '/saude' },
  goal:             { icon: '🎯', color: '#3B82F6', rgb: '59,130,246',  label: 'Meta',        href: '/metas' },
  streak:           { icon: '🔥', color: '#FF4D00', rgb: '255,77,0',   label: 'Streak' },
  bonus:            { icon: '⭐', color: '#F5C842', rgb: '245,200,66',  label: 'Bônus' },
  achievement:      { icon: '🏆', color: '#F5C842', rgb: '245,200,66', label: 'Conquista',   href: '/conquistas' },
  finance_goal:     { icon: '💰', color: '#00FF88', rgb: '0,255,136',  label: 'Meta fin.',   href: '/financas/metas' },
  transaction:      { icon: '💳', color: '#3B82F6', rgb: '59,130,246', label: 'Finanças',    href: '/financas' },
  onboarding:       { icon: '🚀', color: '#7C3AED', rgb: '124,58,237', label: 'Onboarding' },
  system:           { icon: '⚡', color: '#F5C842', rgb: '245,200,66', label: 'Sistema' },
}

function getSourceCfg(type: string) {
  return SOURCE_CONFIG[type] ?? SOURCE_CONFIG.system!
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  if (hours < 24) return `${hours}h atrás`
  if (days === 1) return 'ontem'
  return `${days}d atrás`
}

function isRecent(date: string, minutes = 30): boolean {
  return Date.now() - new Date(date).getTime() < minutes * 60000
}

type GroupKey = 'hoje' | 'ontem' | 'mais_antigo'

function getGroupKey(date: string): GroupKey {
  const diff = Date.now() - new Date(date).getTime()
  if (diff < 86400000) return 'hoje'
  if (diff < 172800000) return 'ontem'
  return 'mais_antigo'
}

const GROUP_LABELS: Record<GroupKey, string> = {
  hoje: 'Hoje',
  ontem: 'Ontem',
  mais_antigo: 'Mais antigo',
}

// ─── Source Breakdown Chip ────────────────────────────────────────────────────

function BreakdownChip({ type, xp, count }: { type: string; xp: number; count: number }) {
  const cfg = getSourceCfg(type)
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium"
      style={{
        background: `rgba(${cfg.rgb},0.1)`,
        border: `1px solid rgba(${cfg.rgb},0.2)`,
      }}
    >
      <span>{cfg.icon}</span>
      <span style={{ color: cfg.color }}>{cfg.label}</span>
      <span className="text-text-muted">·</span>
      <span className="text-brand-gold font-bold">+{xp}</span>
      {count > 1 && (
        <span className="text-text-muted">({count}x)</span>
      )}
    </div>
  )
}

// ─── Timeline Entry ───────────────────────────────────────────────────────────

function TimelineEntry({
  tx,
  index,
  isLast,
  groupVisible,
}: {
  tx: XpTransaction
  index: number
  isLast: boolean
  groupVisible: boolean
}) {
  const [visible, setVisible] = useState(false)
  const cfg = getSourceCfg(tx.source_type)
  const fresh = isRecent(tx.created_at, 30)

  useEffect(() => {
    if (!groupVisible) return
    const t = setTimeout(() => setVisible(true), 40 + index * 70)
    return () => clearTimeout(t)
  }, [groupVisible, index])

  return (
    <div
      className="flex items-start gap-0 transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(12px)',
      }}
    >
      {/* Timeline stem + dot */}
      <div className="flex flex-col items-center mr-3 shrink-0" style={{ width: 20 }}>
        <div
          className="w-3 h-3 rounded-full shrink-0 z-10 mt-1"
          style={{
            background: cfg.color,
            boxShadow: `0 0 6px ${cfg.color}60`,
            border: `2px solid rgba(${cfg.rgb},0.3)`,
          }}
        />
        {!isLast && (
          <div
            className="flex-1 mt-1"
            style={{ width: 1.5, minHeight: 24, background: 'rgba(255,255,255,0.06)' }}
          />
        )}
      </div>

      {/* Entry card */}
      <div
        className="flex-1 flex items-start gap-3 pb-4 group cursor-default"
      >
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 transition-transform group-hover:scale-105"
          style={{
            background: `rgba(${cfg.rgb},0.12)`,
            border: `1px solid rgba(${cfg.rgb},0.22)`,
          }}
        >
          {cfg.icon}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium leading-tight truncate max-w-[200px]">
              {tx.reason}
            </span>
            {fresh && (
              <span
                className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full shrink-0"
                style={{ background: 'rgba(0,255,136,0.15)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.25)' }}
              >
                <span className="w-1 h-1 rounded-full bg-brand-green inline-block animate-pulse" />
                novo
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
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
          className="flex items-center gap-0.5 text-sm font-black shrink-0 px-2 py-1 rounded-lg transition-all group-hover:scale-105"
          style={{ background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.18)', color: '#F5C842' }}
        >
          <Zap size={11} fill="currentColor" />
          +{tx.amount}
        </div>
      </div>
    </div>
  )
}

// ─── Group Section ────────────────────────────────────────────────────────────

function GroupSection({
  label,
  entries,
  sectionVisible,
  baseIndex,
}: {
  label: string
  entries: XpTransaction[]
  sectionVisible: boolean
  baseIndex: number
}) {
  const [headerVisible, setHeaderVisible] = useState(false)

  useEffect(() => {
    if (!sectionVisible) return
    const t = setTimeout(() => setHeaderVisible(true), 20)
    return () => clearTimeout(t)
  }, [sectionVisible])

  return (
    <div className="space-y-0">
      {/* Group label */}
      <div
        className="flex items-center gap-2 mb-3 transition-all duration-300"
        style={{ opacity: headerVisible ? 1 : 0, transform: headerVisible ? 'translateY(0)' : 'translateY(-4px)' }}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{label}</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
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
  )
}

// ─── Animated Total ───────────────────────────────────────────────────────────

function AnimatedTotal({ target }: { target: number }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const duration = 1000
    const raf = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) requestAnimationFrame(raf)
    }
    const id = requestAnimationFrame(raf)
    return () => cancelAnimationFrame(id)
  }, [target])

  return <>{value.toLocaleString('pt-BR')}</>
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  const CTALINKS = [
    { label: 'Registrar hábito', href: '/habitos', color: '#FF4D00', rgb: '255,77,0', emoji: '🎯' },
    { label: 'Completar tarefa', href: '/tarefas', color: '#7C3AED', rgb: '124,58,237', emoji: '✅' },
    { label: 'Iniciar treino', href: '/treinos', color: '#00FF88', rgb: '0,255,136', emoji: '💪' },
  ]

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(245,200,66,0.05) 0%, rgba(13,24,41,0.98) 100%)',
        border: '1px solid rgba(245,200,66,0.15)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.25)' }}
        >
          <Activity size={13} style={{ color: '#F5C842' }} />
        </div>
        <h2 className="font-bold text-sm">Atividade Recente</h2>
      </div>

      <div className="text-center py-6 space-y-4">
        <div className="text-5xl">🌱</div>
        <div>
          <p className="text-sm font-semibold text-text-secondary">Nenhuma atividade ainda</p>
          <p className="text-xs text-text-muted mt-1">
            Cada ação concede XP e aparece aqui em tempo real
          </p>
        </div>
        <div className="flex flex-col gap-2 max-w-xs mx-auto">
          {CTALINKS.map((cta) => (
            <a
              key={cta.href}
              href={cta.href}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
              style={{
                background: `rgba(${cta.rgb},0.08)`,
                border: `1px solid rgba(${cta.rgb},0.18)`,
                color: cta.color,
              }}
            >
              <span>{cta.emoji} {cta.label}</span>
              <ArrowRight size={13} />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ActivityFeed({ transactions }: { transactions: XpTransaction[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  if (transactions.length === 0) return <EmptyState />

  const totalXp = transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
  const hasLive = transactions.some((t) => isRecent(t.created_at, 30))

  // Group by time
  const groups: Record<GroupKey, XpTransaction[]> = { hoje: [], ontem: [], mais_antigo: [] }
  for (const tx of transactions) {
    groups[getGroupKey(tx.created_at)].push(tx)
  }
  const orderedGroups: GroupKey[] = ['hoje', 'ontem', 'mais_antigo']

  // Source breakdown (aggregate XP + count by source_type)
  const breakdown: Record<string, { xp: number; count: number }> = {}
  for (const tx of transactions) {
    if (!breakdown[tx.source_type]) breakdown[tx.source_type] = { xp: 0, count: 0 }
    breakdown[tx.source_type]!.xp += tx.amount
    breakdown[tx.source_type]!.count += 1
  }
  const breakdownEntries = Object.entries(breakdown)
    .sort(([, a], [, b]) => b.xp - a.xp)

  return (
    <div
      ref={ref}
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(245,200,66,0.06) 0%, rgba(13,24,41,0.98) 100%)',
        border: '1px solid rgba(245,200,66,0.15)',
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,200,66,0.08) 0%, transparent 70%)' }}
      />

      <div className="relative z-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.25)' }}
            >
              <Activity size={13} style={{ color: '#F5C842' }} />
            </div>
            <h2 className="font-bold">Atividade Recente</h2>

            {/* Live badge */}
            {hasLive && (
              <div
                className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(0,255,136,0.12)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.22)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green inline-block animate-pulse" />
                ao vivo
              </div>
            )}
          </div>

          {/* Total XP pill */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.25)' }}
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
          <div className="flex flex-wrap gap-1.5 mb-5">
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
            const entries = groups[key]
            if (entries.length === 0) return null
            const baseIndex = orderedGroups
              .slice(0, gi)
              .reduce((sum, k) => sum + groups[k].length, 0)
            return (
              <GroupSection
                key={key}
                label={GROUP_LABELS[key]}
                entries={entries}
                sectionVisible={visible}
                baseIndex={baseIndex}
              />
            )
          })}
        </div>

        {/* ── Footer: period note ──────────────────────────────────────────── */}
        {transactions.length >= 20 && (
          <div className="mt-3 pt-3 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-xs text-text-muted">
              Últimas {transactions.length} atividades · 48h
            </p>
          </div>
        )}
        {transactions.length < 20 && (
          <div className="mt-3 pt-3 text-xs text-text-muted text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            {transactions.length} atividade{transactions.length !== 1 ? 's' : ''} nas últimas 48h
          </div>
        )}
      </div>
    </div>
  )
}
