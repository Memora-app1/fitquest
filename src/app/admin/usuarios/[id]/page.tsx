import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession, hasMinRole } from '@/lib/admin'
import { redirect, notFound } from 'next/navigation'
import {
  Zap, Flame, Trophy, Calendar, CreditCard, Dumbbell,
  CheckSquare, DollarSign, MessageSquare, AlertTriangle, Clock,
  Shield, UserX, Gift,
} from 'lucide-react'
import { UserAdminActions } from './user-admin-actions'

export const dynamic = 'force-dynamic'

const LEVEL_NAMES = ['', 'Iniciante', 'Dedicado', 'Consistente', 'Atleta', 'Guerreiro', 'Elite', 'Lendário', 'Ascendia Master']

async function getUserDetail(userId: string) {
  const db = createServiceClient()

  const [
    profileRes, xpHistRes, habitsRes, workoutsRes,
    tasksRes, achievementsRes, notesRes, suspensionsRes, reportsRes,
  ] = await Promise.all([
    db.from('profiles').select('*').eq('id', userId).single(),
    db.from('xp_transactions')
      .select('id, amount, reason, source_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(15),
    db.from('habits')
      .select('id, name, icon, xp_per_completion, is_active')
      .eq('user_id', userId)
      .eq('is_active', true),
    db.from('workouts')
      .select('id, title, duration_minutes, xp_earned, started_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(5),
    db.from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('completed_at', 'is', null),
    db.from('user_achievements')
      .select('unlocked_at, achievements(name, icon, rarity)')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false })
      .limit(10),
    db.from('user_admin_notes')
      .select('id, note, is_pinned, created_at, admin_id')
      .eq('user_id', userId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false }),
    db.from('user_suspensions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
    db.from('user_reports')
      .select('id, reason, status, created_at')
      .eq('reported_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  if (!profileRes.data) return null

  return {
    profile:      profileRes.data,
    xpHistory:    xpHistRes.data   ?? [],
    habits:       habitsRes.data   ?? [],
    workouts:     workoutsRes.data ?? [],
    tasksCompleted: tasksRes.count ?? 0,
    achievements: achievementsRes.data ?? [],
    notes:        notesRes.data    ?? [],
    suspensions:  suspensionsRes.data ?? [],
    reports:      reportsRes.data  ?? [],
  }
}

const SUB_COLORS: Record<string, string> = {
  trial:     '#3B82F6',
  active:    '#00FF88',
  cancelled: '#F5C842',
  expired:   '#FF4D00',
  lifetime:  '#7C3AED',
}
const SUB_LABELS: Record<string, string> = {
  trial:     'Trial',
  active:    'Ativo',
  cancelled: 'Cancelado',
  expired:   'Expirado',
  lifetime:  'Lifetime',
}
const RARITY_COLORS: Record<string, string> = {
  common:    '#8899BB',
  rare:      '#3B82F6',
  epic:      '#7C3AED',
  legendary: '#F5C842',
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const session = await getAdminSession(user)
  if (!session || !hasMinRole(session, 'support')) redirect('/admin')

  const { id } = await params
  const data = await getUserDetail(id)
  if (!data) notFound()

  const { profile, xpHistory, habits, workouts, tasksCompleted, achievements, notes, suspensions, reports } = data
  const subColor = SUB_COLORS[profile.subscription_status] ?? '#8899BB'

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      {/* Header do perfil */}
      <div
        className="rounded-xl p-5 flex flex-wrap gap-5 items-start"
        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0"
          style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', color: '#7C3AED' }}
        >
          {profile.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-black" style={{ color: '#fff' }}>{profile.name}</h1>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: `rgba(${hexToRgb(subColor)},0.12)`, color: subColor }}
            >
              {SUB_LABELS[profile.subscription_status]}
            </span>
            {profile.is_suspended && (
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1"
                style={{ background: 'rgba(255,77,0,0.12)', color: '#FF4D00' }}
              >
                <UserX size={10} /> Suspenso
              </span>
            )}
          </div>
          <div className="text-xs mt-1" style={{ color: '#8899BB' }}>{id}</div>
          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <Zap size={13} style={{ color: '#F5C842' }} fill="currentColor" />
              <span className="text-sm font-bold" style={{ color: '#F5C842' }}>
                {(profile.xp_total ?? 0).toLocaleString('pt-BR')} XP
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy size={13} style={{ color: '#7C3AED' }} />
              <span className="text-sm font-semibold" style={{ color: '#fff' }}>
                Nv {profile.level} — {LEVEL_NAMES[profile.level] ?? ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame size={13} style={{ color: '#FF4D00' }} fill="currentColor" />
              <span className="text-sm font-semibold" style={{ color: '#fff' }}>
                {profile.streak_current}d (recorde: {profile.streak_longest}d)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={13} style={{ color: '#8899BB' }} />
              <span className="text-sm" style={{ color: '#8899BB' }}>
                Cadastro: {new Date(profile.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* Ações rápidas — Client Component */}
        <UserAdminActions
          userId={id}
          currentSession={session}
          isSuspended={!!profile.is_suspended}
          subscriptionStatus={profile.subscription_status}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-5">

        {/* Histórico de XP */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#fff' }}>
            <Zap size={14} style={{ color: '#F5C842' }} /> Histórico de XP (15 últimos)
          </h2>
          <div className="space-y-1.5">
            {xpHistory.map((tx: Record<string, unknown>) => (
              <div key={tx.id as string} className="flex items-center justify-between text-xs">
                <div className="truncate flex-1" style={{ color: '#8899BB' }}>{tx.reason as string}</div>
                <div
                  className="font-bold ml-2 shrink-0"
                  style={{ color: (tx.amount as number) > 0 ? '#00FF88' : '#FF4D00' }}
                >
                  {(tx.amount as number) > 0 ? '+' : ''}{tx.amount as number}
                </div>
                <div className="w-20 text-right shrink-0" style={{ color: '#8899BB' }}>
                  {new Date(tx.created_at as string).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hábitos ativos */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#fff' }}>
            <Flame size={14} style={{ color: '#FF4D00' }} /> Hábitos Ativos ({habits.length})
          </h2>
          {habits.length === 0 && (
            <p className="text-xs" style={{ color: '#8899BB' }}>Nenhum hábito ativo.</p>
          )}
          <div className="space-y-1.5">
            {habits.map((h: Record<string, unknown>) => (
              <div key={h.id as string} className="flex items-center justify-between text-xs">
                <span>{h.icon as string} <span style={{ color: '#fff' }}>{h.name as string}</span></span>
                <span style={{ color: '#F5C842' }}>+{h.xp_per_completion as number} XP</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conquistas */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#fff' }}>
            <Trophy size={14} style={{ color: '#7C3AED' }} /> Conquistas ({achievements.length})
          </h2>
          <div className="grid grid-cols-2 gap-1.5">
            {achievements.map((ua: Record<string, unknown>) => {
              const ach = ua.achievements as Record<string, unknown>
              const rColor = RARITY_COLORS[ach?.rarity as string] ?? '#8899BB'
              return (
                <div
                  key={ua.unlocked_at as string}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
                  style={{ background: `rgba(${hexToRgb(rColor)},0.08)`, color: '#fff' }}
                >
                  <span>{ach?.icon as string}</span>
                  <span className="truncate">{ach?.name as string}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats rápidas */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-sm font-bold mb-3" style={{ color: '#fff' }}>Estatísticas</h2>
          <div className="space-y-2">
            {[
              { icon: <Dumbbell size={13} />,    label: 'Treinos',        value: workouts.length,         color: '#7C3AED' },
              { icon: <CheckSquare size={13} />, label: 'Tarefas feitas', value: tasksCompleted,           color: '#00FF88' },
              { icon: <Shield size={13} />,      label: 'Dias perfeitos', value: profile.perfect_days,    color: '#F5C842' },
              { icon: <Gift size={13} />,        label: 'Streak freeze',  value: profile.streak_freezes_remaining ?? 0, color: '#3B82F6' },
              { icon: <Clock size={13} />,       label: 'Último acesso',  value: profile.last_activity_date
                ? new Date(profile.last_activity_date).toLocaleDateString('pt-BR')
                : '—', color: '#8899BB' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2" style={{ color: '#8899BB' }}>
                  <span style={{ color: row.color }}>{row.icon}</span>
                  {row.label}
                </div>
                <span className="font-bold" style={{ color: '#fff' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Notas admin */}
      <div
        className="rounded-xl p-4"
        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#fff' }}>
          <MessageSquare size={14} style={{ color: '#3B82F6' }} /> Notas Administrativas
        </h2>
        {notes.length === 0 && (
          <p className="text-xs mb-3" style={{ color: '#8899BB' }}>Nenhuma nota ainda.</p>
        )}
        <div className="space-y-2 mb-3">
          {notes.map((note: Record<string, unknown>) => (
            <div
              key={note.id as string}
              className="p-3 rounded-lg text-xs"
              style={{
                background: note.is_pinned ? 'rgba(245,200,66,0.06)' : 'rgba(255,255,255,0.03)',
                border: note.is_pinned ? '1px solid rgba(245,200,66,0.2)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ color: '#fff' }}>{note.note as string}</div>
              <div className="mt-1" style={{ color: '#8899BB' }}>
                {new Date(note.created_at as string).toLocaleString('pt-BR')}
              </div>
            </div>
          ))}
        </div>

        {/* Form para nova nota */}
        {hasMinRole(session, 'support') && (
          <form action={`/api/admin/users/${id}/note`} method="POST" className="flex gap-2">
            <input
              name="note"
              placeholder="Adicionar nota..."
              required
              className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff',
              }}
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-lg text-xs font-semibold"
              style={{ background: '#3B82F6', color: '#fff' }}
            >
              Salvar
            </button>
          </form>
        )}
      </div>

      {/* Denúncias recebidas */}
      {reports.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(255,77,0,0.04)', border: '1px solid rgba(255,77,0,0.2)' }}
        >
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#FF4D00' }}>
            <AlertTriangle size={14} /> Denúncias Recebidas ({reports.length})
          </h2>
          <div className="space-y-2">
            {reports.map((r: Record<string, unknown>) => (
              <div key={r.id as string} className="flex items-center justify-between text-xs">
                <span style={{ color: '#fff' }}>{r.reason as string}</span>
                <span
                  className="px-2 py-0.5 rounded-full font-bold"
                  style={{
                    background: r.status === 'pending' ? 'rgba(255,77,0,0.15)' : 'rgba(0,255,136,0.1)',
                    color:      r.status === 'pending' ? '#FF4D00' : '#00FF88',
                  }}
                >
                  {r.status as string}
                </span>
                <span style={{ color: '#8899BB' }}>
                  {new Date(r.created_at as string).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suspensões */}
      {suspensions.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#fff' }}>
            <UserX size={14} style={{ color: '#FF4D00' }} /> Histórico de Suspensões
          </h2>
          <div className="space-y-2">
            {suspensions.map((s: Record<string, unknown>) => (
              <div
                key={s.id as string}
                className="p-3 rounded-lg text-xs"
                style={{ background: 'rgba(255,77,0,0.05)', border: '1px solid rgba(255,77,0,0.15)' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold" style={{ color: '#FF4D00' }}>{s.type as string}</span>
                  {s.lifted_at != null && <span style={{ color: '#00FF88' }}>Levantada</span>}
                </div>
                <div style={{ color: '#fff' }}>{s.reason as string}</div>
                <div className="mt-1" style={{ color: '#8899BB' }}>
                  {new Date(s.starts_at as string).toLocaleDateString('pt-BR')}
                  {s.ends_at != null && ` → ${new Date(s.ends_at as string).toLocaleDateString('pt-BR')}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
