'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getLevelInfo } from '@/lib/xp'
import {
  Users, Zap, Flame, Crown, Shield, Star,
  LogOut, Copy, Check, Trophy, Medal, ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

type Member = {
  user_id: string
  role: string
  joined_at: string
  weekly_xp: number
  last_week_xp: number
  position: number
  isCurrentUser: boolean
  profile: {
    name: string
    level: number
    prestige_level: number
    streak_current: number
    equipped_title: string | null
  } | null
}

type Guild = {
  id: string
  name: string
  tag: string
  motto: string | null
  avatar_emoji: string
  xp_total: number
  weekly_xp: number
  max_members: number
  invite_code: string
  is_public: boolean
  created_by: string
  created_at: string
  member_count: number
}

interface Props {
  data: {
    guild: Guild
    members: Member[]
    myRole: string | null
    isMember: boolean
    isOwner: boolean
  }
}

const DEFAULT_ROLE: { label: string; color: string; icon: React.ElementType } =
  { label: 'Membro', color: '#8899BB', icon: Users }

const ROLE_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  owner:     { label: 'Líder',    color: '#F5C842', icon: Crown },
  moderator: { label: 'Mod',      color: '#7C3AED', icon: Shield },
  member:    DEFAULT_ROLE,
}

const POSITION_STYLES: Record<number, { bg: string; color: string; shadow: string }> = {
  1: { bg: 'rgba(245,200,66,0.15)', color: '#F5C842', shadow: '0 0 12px rgba(245,200,66,0.3)' },
  2: { bg: 'rgba(192,192,192,0.12)', color: '#C0C0C0', shadow: '' },
  3: { bg: 'rgba(205,127,50,0.12)', color: '#CD7F32', shadow: '' },
}

export function GuildDetailClient({ data }: Props) {
  const { guild, members, myRole, isMember, isOwner } = data
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')

  function copyInvite() {
    navigator.clipboard.writeText(guild.invite_code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleJoin() {
    setError('')
    startTransition(async () => {
      const res = await fetch(`/api/guilds/${guild.id}/join`, { method: 'POST' })
      const d = await res.json() as { ok?: boolean; message?: string; error?: string }
      if (!res.ok) { setError(d.message ?? d.error ?? 'Erro ao entrar'); return }
      setSuccess(d.message ?? 'Bem-vindo à guild!')
      router.refresh()
    })
  }

  function handleLeave() {
    if (!confirm('Tem certeza que quer sair da guild?')) return
    setError('')
    startTransition(async () => {
      const res = await fetch(`/api/guilds/${guild.id}`, { method: 'DELETE' })
      const d = await res.json() as { ok?: boolean; message?: string; error?: string }
      if (!res.ok) { setError(d.message ?? d.error ?? 'Erro ao sair'); return }
      router.push('/guilds')
    })
  }

  const posStyle = (pos: number) => POSITION_STYLES[pos] ?? { bg: 'transparent', color: '#8899BB', shadow: '' }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Back */}
      <Link href="/guilds" className="flex items-center gap-1.5 text-sm text-text-muted hover:text-white transition-colors">
        <ArrowLeft size={15} /> Todas as Guilds
      </Link>

      {/* Guild header */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.98) 100%)',
          border: '1px solid rgba(124,58,237,0.25)',
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
            style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}
          >
            {guild.avatar_emoji}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[11px] font-black px-2 py-0.5 rounded"
                style={{ background: 'rgba(124,58,237,0.2)', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.3)' }}
              >
                [{guild.tag}]
              </span>
              <h1 className="text-xl font-black text-white">{guild.name}</h1>
            </div>
            {guild.motto && (
              <p className="text-sm italic text-text-muted mt-1">"{guild.motto}"</p>
            )}

            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-sm">
                <Users size={13} className="text-text-muted" />
                <span className="text-text-muted">{guild.member_count}</span>
                <span className="text-text-muted text-xs">/ {guild.max_members}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Zap size={13} style={{ color: '#F5C842' }} />
                <span style={{ color: '#F5C842' }} className="font-bold">
                  {guild.weekly_xp.toLocaleString('pt-BR')} XP
                </span>
                <span className="text-text-muted text-xs">esta semana</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Trophy size={13} className="text-brand-orange" />
                <span className="text-text-muted">{guild.xp_total.toLocaleString('pt-BR')} total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Invite code + actions */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-white/5">
          <button
            onClick={copyInvite}
            className="flex items-center gap-2 text-xs text-text-muted hover:text-white transition-colors"
          >
            {copied ? <Check size={13} className="text-brand-green" /> : <Copy size={13} />}
            Código: <span className="font-black tracking-widest text-white">{guild.invite_code}</span>
          </button>

          {isMember ? (
            !isOwner && (
              <button
                onClick={handleLeave}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'rgba(255,77,0,0.08)', color: '#FF4D00', border: '1px solid rgba(255,77,0,0.15)' }}
              >
                <LogOut size={12} /> Sair da guild
              </button>
            )
          ) : (
            <button
              onClick={handleJoin}
              disabled={isPending || guild.member_count >= guild.max_members}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: '#7C3AED', color: '#fff' }}
            >
              {isPending ? 'Entrando...' : guild.member_count >= guild.max_members ? 'Guild cheia' : 'Entrar na Guild'}
            </button>
          )}
        </div>

        {(error || success) && (
          <div
            className="text-sm p-2.5 rounded-xl"
            style={{
              background: error ? 'rgba(255,77,0,0.1)' : 'rgba(0,255,136,0.08)',
              color: error ? '#FF4D00' : '#00FF88',
            }}
          >
            {error || success}
          </div>
        )}
      </div>

      {/* Ranking semanal */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
          <Medal size={14} />
          Ranking Semanal
        </h2>

        <div className="space-y-2">
          {members.map((member) => {
            const ps     = posStyle(member.position)
            const lvInfo = getLevelInfo(member.profile?.level ?? 1)
            const role   = (ROLE_LABELS[member.role] ?? ROLE_LABELS['member'])!
            const RoleIcon = role.icon

            return (
              <div
                key={member.user_id}
                className="rounded-xl p-3.5 flex items-center gap-3 transition-all"
                style={{
                  background: member.isCurrentUser
                    ? 'rgba(255,77,0,0.06)'
                    : 'rgba(255,255,255,0.025)',
                  border: member.isCurrentUser
                    ? '1px solid rgba(255,77,0,0.2)'
                    : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: member.position <= 3 ? ps.shadow : undefined,
                }}
              >
                {/* Position */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                  style={{ background: ps.bg, color: ps.color }}
                >
                  {member.position}
                </div>

                {/* Avatar placeholder with initials */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${member.isCurrentUser ? '#FF4D00' : '#7C3AED'}, ${member.isCurrentUser ? '#7C3AED' : '#3B82F6'})`,
                    color: '#fff',
                  }}
                >
                  {(member.profile?.name ?? '?').slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-white truncate">
                      {member.profile?.name ?? 'Usuário'}
                      {member.isCurrentUser && (
                        <span className="text-brand-orange ml-1 text-xs">(você)</span>
                      )}
                    </span>

                    {member.profile?.equipped_title && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: 'rgba(245,200,66,0.1)', color: '#F5C842', border: '1px solid rgba(245,200,66,0.2)' }}>
                        {member.profile.equipped_title}
                      </span>
                    )}

                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{ color: role.color, background: `${role.color}18` }}>
                      <RoleIcon size={8} className="inline mr-0.5" />
                      {role.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 mt-0.5">
                    <span className="text-[11px] text-text-muted">
                      {lvInfo.emoji} Nv {member.profile?.level ?? 1}
                    </span>
                    {(member.profile?.streak_current ?? 0) > 0 && (
                      <span className="flex items-center gap-0.5 text-[11px]">
                        <Flame size={9} className="text-brand-orange" />
                        <span className="text-brand-orange font-bold">{member.profile!.streak_current}</span>
                      </span>
                    )}
                    {member.profile?.prestige_level && member.profile.prestige_level > 0 ? (
                      <span className="flex items-center gap-0.5 text-[11px]">
                        <Star size={9} style={{ color: '#F5C842' }} />
                        <span style={{ color: '#F5C842' }} className="font-bold">P{member.profile.prestige_level}</span>
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* XP */}
                <div className="text-right shrink-0">
                  <div className="text-sm font-black" style={{ color: '#F5C842' }}>
                    {(member.weekly_xp ?? 0).toLocaleString('pt-BR')}
                  </div>
                  <div className="text-[10px] text-text-muted">XP/sem</div>
                </div>
              </div>
            )
          })}

          {members.length === 0 && (
            <div className="text-center py-10">
              <Users size={32} className="mx-auto text-text-muted opacity-40 mb-2" />
              <p className="text-sm text-text-muted">Nenhum membro ainda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
