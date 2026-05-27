import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import Link from 'next/link'
import { EisenhowerBoard } from '@/components/tarefas/eisenhower-board'
import { EisenhowerInsights } from '@/components/tarefas/eisenhower-insights'
import { TaskDueDateHeatmap } from '@/components/tarefas/task-due-date-heatmap'
import { LayoutGrid } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Matriz Eisenhower',
  description: 'Priorize suas tarefas pela Matriz Eisenhower — urgente vs importante.',
}

export const dynamic = 'force-dynamic'

export default async function EisenhowerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, urgent, important, status, xp_reward, due_date')
    .eq('user_id', user.id)
    .not('status', 'eq', 'archived')
    .order('created_at', { ascending: false })

  const activeTasks = (tasks ?? []).filter((t) => t.status !== 'done')
  const doneTasks = (tasks ?? []).filter((t) => t.status === 'done')

  const urgentImportant = activeTasks.filter((t) => t.urgent && t.important).length
  const importantOnly = activeTasks.filter((t) => !t.urgent && t.important).length
  const urgentOnly = activeTasks.filter((t) => t.urgent && !t.important).length
  const neither = activeTasks.filter((t) => !t.urgent && !t.important).length

  const quadrants: {
    count: number
    label: string
    sublabel: string
    color: string
    glow: string
    border: string
    action: string
  }[] = [
    {
      count: urgentImportant,
      label: 'Fazer agora',
      sublabel: 'Urgente + Importante',
      action: '🔴 Faça você mesmo',
      color: '#EF4444',
      glow: 'rgba(239,68,68,0.15)',
      border: 'rgba(239,68,68,0.3)',
    },
    {
      count: importantOnly,
      label: 'Agendar',
      sublabel: 'Importante, não urgente',
      action: '🟢 Agende para depois',
      color: '#00FF88',
      glow: 'rgba(0,255,136,0.12)',
      border: 'rgba(0,255,136,0.3)',
    },
    {
      count: urgentOnly,
      label: 'Delegar',
      sublabel: 'Urgente, não importante',
      action: '🟡 Delegue se possível',
      color: '#F5C842',
      glow: 'rgba(245,200,66,0.15)',
      border: 'rgba(245,200,66,0.3)',
    },
    {
      count: neither,
      label: 'Eliminar',
      sublabel: 'Nem urgente, nem importante',
      action: '⚪ Considere eliminar',
      color: '#8899BB',
      glow: 'rgba(136,153,187,0.1)',
      border: 'rgba(136,153,187,0.2)',
    },
  ]

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,77,0,0.07) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.05) 100%)',
            border: '1px solid rgba(255,77,0,0.2)',
          }}
        >
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,77,0,0.1) 0%, transparent 70%)' }}
          />
          <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="heading-display text-4xl md:text-5xl">Matriz Eisenhower</h1>
              <p className="text-text-secondary mt-1">
                Separe o urgente do que realmente importa.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/tarefas" className="btn-ghost text-sm flex items-center gap-1.5">
                <LayoutGrid size={14} /> Kanban
              </Link>
              <Link
                href="/tarefas/eisenhower"
                className="btn-ghost text-sm flex items-center gap-1.5"
                style={{ background: 'rgba(255,77,0,0.15)', color: '#FF4D00', borderColor: 'rgba(255,77,0,0.4)' }}
              >
                🎯 Eisenhower
              </Link>
            </div>
          </div>
        </div>

        {/* ── Quadrant stats ──────────────────────────────────────────── */}
        {activeTasks.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quadrants.map((q) => (
              <div
                key={q.label}
                className="rounded-2xl p-4 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${q.glow.replace(')', ', 0.5)').replace('rgba(', 'rgba(')} 0%, rgba(13,24,41,0.98) 100%)`,
                  border: `1px solid ${q.border}`,
                }}
              >
                <div
                  className="absolute -top-4 -right-4 w-14 h-14 rounded-full pointer-events-none blur-lg"
                  style={{ backgroundColor: q.color, opacity: 0.15 }}
                />
                <div className="relative z-10">
                  <div className="heading-display text-3xl mb-1" style={{ color: q.color }}>
                    {q.count}
                  </div>
                  <div className="text-sm font-semibold">{q.label}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">{q.sublabel}</div>
                  <div className="text-[10px] text-text-muted mt-2 opacity-70">{q.action}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 6-week due date calendar heatmap ────────────────────────── */}
        <TaskDueDateHeatmap userId={user.id} />

        {/* ── Prioritization analytics ─────────────────────────────────── */}
        <EisenhowerInsights userId={user.id} />

        {/* ── Board ───────────────────────────────────────────────────── */}
        <EisenhowerBoard initialTasks={[...activeTasks, ...doneTasks]} />
      </div>
    </AppShell>
  )
}
