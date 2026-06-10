'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, Trophy, Zap, Search, Plus, Shield, Crown,
  LogOut, Copy, Check, ChevronRight,
} from 'lucide-react'

interface Guild {
  id: string
  name: string
  tag: string
  motto: string | null
  avatar_emoji: string
  xp_total: number
  weekly_xp: number
  max_members: number
  invite_code: string
  member_count: number
  is_member: boolean
}

interface GuildsClientProps {
  guilds: Guild[]
  myGuildId: string | null
  myRole: string | null
  userLevel: number
}

const EMOJI_OPTIONS = ['⚡', '🔥', '⚔️', '🛡️', '🏆', '💎', '👑', '🌙', '⭐', '🦅', '🐉', '🌊', '🎯', '🧠', '💪', '🚀', '🌀', '🍀']

function formatXP(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function GuildsClient({ guilds, myGuildId, myRole, userLevel }: GuildsClientProps) {
  const router                            = useRouter()
  const [isPending, startTransition]      = useTransition()
  const [search, setSearch]               = useState('')
  const [showCreate, setShowCreate]       = useState(false)
  const [joiningId, setJoiningId]         = useState<string | null>(null)
  const [error, setError]                 = useState<string | null>(null)
  const [success, setSuccess]             = useState<string | null>(null)
  const [copiedInvite, setCopiedInvite]   = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [inviteCode, setInviteCode]       = useState('')

  const [form, setForm] = useState({
    name: '', tag: '', motto: '', avatar_emoji: '⚡',
  })

  const myGuild  = guilds.find((g) => g.id === myGuildId) ?? null
  const filtered = guilds.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.tag.toLowerCase().includes(search.toLowerCase())
  )

  function flash(type: 'error' | 'success', msg: string) {
    if (type === 'error') { setError(msg); setSuccess(null) }
    else                  { setSuccess(msg); setError(null) }
  }

  async function joinById(guildId: string) {
    setJoiningId(guildId)
    setError(null)
    try {
      const res  = await fetch(`/api/guilds/${guildId}/join`, { method: 'POST' })
      const data = await res.json() as { message?: string }
      if (!res.ok) flash('error', data.message ?? 'Erro ao entrar na guild.')
      else {
        flash('success', data.message ?? 'Você entrou na guild!')
        startTransition(() => router.refresh())
      }
    } catch { flash('error', 'Erro de conexão.') }
    setJoiningId(null)
  }

  async function joinByCode() {
    if (!inviteCode.trim()) return
    setError(null)
    try {
      const res  = await fetch(`/api/guilds/${inviteCode.trim().toUpperCase()}/join`, { method: 'POST' })
      const data = await res.json() as { message?: string }
      if (!res.ok) flash('error', data.message ?? 'Código inválido ou guild cheia.')
      else {
        flash('success', data.message ?? 'Você entrou na guild!')
        setInviteCode('')
        startTransition(() => router.refresh())
      }
    } catch { flash('error', 'Erro de conexão.') }
  }

  async function leaveGuild() {
    if (!myGuildId) return
    if (!confirm('Tem certeza que quer sair da guild?')) return
    setError(null)
    try {
      const res  = await fetch(`/api/guilds/${myGuildId}`, { method: 'DELETE' })
      const data = await res.json() as { message?: string }
      if (!res.ok) flash('error', data.message ?? 'Erro ao sair da guild.')
      else {
        flash('success', 'Você saiu da guild.')
        startTransition(() => router.refresh())
      }
    } catch { flash('error', 'Erro de conexão.') }
  }

  async function createGuild() {
    if (!form.name.trim() || !form.tag.trim()) {
      flash('error', 'Nome e tag são obrigatórios.')
      return
    }
    setCreateLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/guilds', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json() as { message?: string }
      if (!res.ok) flash('error', data.message ?? 'Erro ao criar guild.')
      else {
        flash('success', data.message ?? 'Guild criada!')
        setShowCreate(false)
        startTransition(() => router.refresh())
      }
    } catch { flash('error', 'Erro de conexão.') }
    setCreateLoading(false)
  }

  function copyInvite(code: string) {
    navigator.clipboard.writeText(code).catch(() => null)
    setCopiedInvite(true)
    setTimeout(() => setCopiedInvite(false), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl tracking-widest text-white uppercase">Guilds</h1>
        <p className="text-[#8899BB] mt-1 text-sm">Entre em um clã, conquiste em grupo e domine o ranking.</p>
      </div>

      {/* Feedback */}
      {error && (
        <div className="bg-[#FF4444]/10 border border-[#FF4444]/30 text-[#FF4444] rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-[#00FF88]/10 border border-[#00FF88]/30 text-[#00FF88] rounded-xl px-4 py-3 text-sm">
          {success}
        </div>
      )}

      {/* Minha Guild */}
      {myGuild && (
        <div
          className="rounded-2xl bg-[#0D1829] border border-[#1F2D45] p-5 space-y-4"
          style={{ boxShadow: '0 0 40px rgba(124,58,237,0.08)' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[#8899BB] uppercase tracking-wider">Minha Guild</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
              myRole === 'owner' ? 'bg-[#F5C842]/20 text-[#F5C842]'
              : myRole === 'admin' ? 'bg-[#7C3AED]/20 text-[#7C3AED]'
              : 'bg-[#152238] text-[#5A6B85]'
            }`}>
              {myRole === 'owner' && <><Crown size={10} /> Líder</>}
              {myRole === 'admin' && <><Shield size={10} /> Admin</>}
              {myRole === 'member' && 'Membro'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#152238] flex items-center justify-center text-3xl flex-shrink-0">
              {myGuild.avatar_emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#5A6B85] font-mono bg-[#152238] px-2 py-0.5 rounded">
                  [{myGuild.tag}]
                </span>
                <span className="font-bold text-white text-lg truncate">{myGuild.name}</span>
              </div>
              {myGuild.motto && (
                <p className="text-[#8899BB] text-sm mt-0.5 italic truncate">"{myGuild.motto}"</p>
              )}
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-[#8899BB] text-xs">
                  <Users size={12} />
                  {myGuild.member_count}/{myGuild.max_members} membros
                </span>
                <span className="flex items-center gap-1 text-[#F5C842] text-xs">
                  <Zap size={12} />
                  {formatXP(myGuild.weekly_xp)} XP semana
                </span>
                <span className="flex items-center gap-1 text-[#5A6B85] text-xs">
                  <Trophy size={12} />
                  {formatXP(myGuild.xp_total)} total
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#1F2D45]">
            <button
              onClick={() => copyInvite(myGuild.invite_code)}
              className="text-sm text-[#8899BB] hover:text-white transition-colors flex items-center gap-2"
            >
              {copiedInvite
                ? <><Check size={14} className="text-[#00FF88]" /> Copiado!</>
                : <><Copy size={14} /> Invite: {myGuild.invite_code}</>
              }
            </button>
            {myRole !== 'owner' && (
              <button
                onClick={leaveGuild}
                className="text-sm text-[#FF4444]/60 hover:text-[#FF4444] flex items-center gap-1.5 transition-colors"
              >
                <LogOut size={14} />
                Sair da guild
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sem guild — ações */}
      {!myGuildId && (
        <>
          {/* Entrar por código */}
          <div className="rounded-2xl bg-[#0D1829] border border-[#1F2D45] p-4">
            <p className="text-xs text-[#8899BB] mb-2">Tem um código de convite?</p>
            <div className="flex gap-2">
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="XXXXXX"
                maxLength={8}
                className="bg-[#152238] border border-[#1F2D45] rounded-xl px-3 py-2 text-white text-sm font-mono flex-1 focus:outline-none focus:border-[#7C3AED] uppercase"
              />
              <button
                onClick={joinByCode}
                disabled={!inviteCode.trim() || isPending}
                className="bg-gradient-to-r from-[#FF4D00] to-[#7C3AED] text-white text-sm px-4 py-2 rounded-xl font-semibold disabled:opacity-50 transition-opacity"
              >
                Entrar
              </button>
            </div>
          </div>

          {/* Busca + criar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6B85]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar guild pelo nome ou tag..."
                className="bg-[#0D1829] border border-[#1F2D45] rounded-xl pl-9 pr-3 py-2.5 text-white text-sm w-full focus:outline-none focus:border-[#7C3AED]"
              />
            </div>
            {userLevel >= 3 ? (
              <button
                onClick={() => setShowCreate((v) => !v)}
                className="bg-gradient-to-r from-[#FF4D00] to-[#7C3AED] text-white text-sm px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 whitespace-nowrap"
              >
                <Plus size={15} />
                Criar Guild
              </button>
            ) : (
              <div className="bg-[#152238] border border-[#1F2D45] text-[#5A6B85] text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-not-allowed whitespace-nowrap">
                <Plus size={15} />
                Nível 3+
              </div>
            )}
          </div>

          {/* Form criar guild */}
          {showCreate && (
            <div className="rounded-2xl bg-[#0D1829] border border-[#7C3AED]/30 p-5 space-y-4">
              <h3 className="font-bold text-white">Nova Guild</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-[#5A6B85] mb-1 block">Nome *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Phoenix Elite"
                    maxLength={40}
                    className="bg-[#152238] border border-[#1F2D45] rounded-xl px-3 py-2.5 text-white text-sm w-full focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#5A6B85] mb-1 block">Tag * (2–6 letras)</label>
                  <input
                    value={form.tag}
                    onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value.toUpperCase() }))}
                    placeholder="PHX"
                    maxLength={6}
                    className="bg-[#152238] border border-[#1F2D45] rounded-xl px-3 py-2.5 text-white text-sm w-full font-mono focus:outline-none focus:border-[#7C3AED] uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#5A6B85] mb-1 block">Emoji</label>
                  <select
                    value={form.avatar_emoji}
                    onChange={(e) => setForm((f) => ({ ...f, avatar_emoji: e.target.value }))}
                    className="bg-[#152238] border border-[#1F2D45] rounded-xl px-3 py-2.5 text-white text-sm w-full focus:outline-none focus:border-[#7C3AED]"
                  >
                    {EMOJI_OPTIONS.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-[#5A6B85] mb-1 block">Motto (opcional)</label>
                  <input
                    value={form.motto}
                    onChange={(e) => setForm((f) => ({ ...f, motto: e.target.value }))}
                    placeholder="Juntos somos imparáveis."
                    maxLength={100}
                    className="bg-[#152238] border border-[#1F2D45] rounded-xl px-3 py-2.5 text-white text-sm w-full focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCreate(false)}
                  className="bg-[#152238] border border-[#1F2D45] text-[#8899BB] text-sm px-4 py-2 rounded-xl hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={createGuild}
                  disabled={createLoading || !form.name.trim() || !form.tag.trim()}
                  className="bg-gradient-to-r from-[#FF4D00] to-[#7C3AED] text-white text-sm px-5 py-2 rounded-xl font-semibold disabled:opacity-50"
                >
                  {createLoading ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>
          )}

          {/* Lista de guilds */}
          <div>
            <h2 className="text-xs font-semibold text-[#8899BB] uppercase tracking-wider mb-3">
              {search
                ? `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`
                : `${filtered.length} guilds disponíveis`
              }
            </h2>

            {filtered.length === 0 ? (
              <div className="rounded-2xl bg-[#0D1829] border border-[#1F2D45] p-12 text-center">
                <p className="text-4xl mb-3">🏰</p>
                <p className="text-[#8899BB] text-sm">
                  {search ? 'Nenhuma guild encontrada.' : 'Nenhuma guild pública disponível ainda.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((guild, idx) => (
                  <div
                    key={guild.id}
                    className="rounded-2xl bg-[#0D1829] border border-[#1F2D45] hover:border-[#7C3AED]/40 transition-colors p-4 flex items-center gap-3"
                  >
                    {/* Rank */}
                    <div className="w-8 text-center flex-shrink-0">
                      {idx === 0 && <span className="text-lg">🥇</span>}
                      {idx === 1 && <span className="text-lg">🥈</span>}
                      {idx === 2 && <span className="text-lg">🥉</span>}
                      {idx >= 3 && (
                        <span className="text-xs font-mono text-[#5A6B85]">#{idx + 1}</span>
                      )}
                    </div>

                    {/* Emoji */}
                    <div className="w-11 h-11 rounded-xl bg-[#152238] flex items-center justify-center text-2xl flex-shrink-0">
                      {guild.avatar_emoji}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#5A6B85] font-mono">[{guild.tag}]</span>
                        <span className="font-semibold text-white text-sm truncate">{guild.name}</span>
                      </div>
                      {guild.motto && (
                        <p className="text-xs text-[#5A6B85] italic truncate mt-0.5">
                          &ldquo;{guild.motto}&rdquo;
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-[#8899BB] flex items-center gap-1">
                          <Users size={11} />
                          {guild.member_count}/{guild.max_members}
                        </span>
                        <span className="text-xs text-[#F5C842] flex items-center gap-1">
                          <Zap size={11} />
                          {formatXP(guild.weekly_xp)}/sem
                        </span>
                      </div>
                    </div>

                    {/* Ação */}
                    <div className="flex-shrink-0">
                      {guild.member_count >= guild.max_members ? (
                        <span className="text-xs text-[#5A6B85] px-3 py-1.5 rounded-lg bg-[#152238]">
                          Cheia
                        </span>
                      ) : (
                        <button
                          onClick={() => joinById(guild.id)}
                          disabled={joiningId === guild.id || isPending}
                          className="bg-gradient-to-r from-[#FF4D00] to-[#7C3AED] text-white text-xs px-4 py-2 rounded-xl font-semibold disabled:opacity-60 flex items-center gap-1"
                        >
                          {joiningId === guild.id
                            ? '...'
                            : <><span>Entrar</span><ChevronRight size={12} /></>
                          }
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
