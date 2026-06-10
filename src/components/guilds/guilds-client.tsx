'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, Zap, Plus, LogOut, Shield, Crown } from 'lucide-react'

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
  member_count: number
  is_member: boolean
}

interface Props {
  guilds: Guild[]
  myGuildId: string | null
  myRole: string | null
  userLevel: number
}

export function GuildsClient({ guilds, myGuildId, myRole, userLevel }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // form state for create
  const [form, setForm] = useState({ name: '', tag: '', motto: '', avatar_emoji: '⚡' })

  const filtered = guilds.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.tag.toLowerCase().includes(search.toLowerCase())
  )

  const myGuild = myGuildId ? guilds.find((g) => g.id === myGuildId) : null

  async function handleJoin(guildId: string) {
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/guilds/${guildId}/join`, { method: 'POST' })
      const data = await res.json() as { ok?: boolean; message?: string; error?: string }
      if (!res.ok) {
        setError(data.message ?? 'Erro ao entrar na guild.')
        return
      }
      setSuccess(data.message ?? 'Bem-vindo à guild!')
      router.refresh()
    })
  }

  async function handleLeave() {
    if (!myGuildId) return
    if (!confirm('Tem certeza que quer sair da guild?')) return
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/guilds/${myGuildId}`, { method: 'DELETE' })
      const data = await res.json() as { ok?: boolean; message?: string; error?: string }
      if (!res.ok) {
        setError(data.message ?? 'Erro ao sair da guild.')
        return
      }
      setSuccess(data.message ?? 'Você saiu da guild.')
      router.refresh()
    })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/guilds', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json() as { ok?: boolean; message?: string; error?: string; guild?: { id: string; name: string; tag: string } }
      if (!res.ok) {
        setError(data.message ?? 'Erro ao criar a guild.')
        return
      }
      setSuccess(data.message ?? 'Guild criada com sucesso!')
      setShowCreate(false)
      router.refresh()
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: '#fff' }}>
            ⚔️ Guilds
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#8899BB' }}>
            Entre em um clã, conquiste em grupo e domine o ranking.
          </p>
        </div>
        {!myGuildId && userLevel >= 3 && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity"
            style={{ background: 'rgba(255,77,0,0.12)', color: '#FF4D00', border: '1px solid rgba(255,77,0,0.2)' }}
          >
            <Plus size={14} /> Criar Guild
          </button>
        )}
      </div>

      {/* Feedback */}
      {error && (
        <div className="px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,77,0,0.1)', color: '#FF4D00', border: '1px solid rgba(255,77,0,0.2)' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(0,255,136,0.08)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.15)' }}>
          {success}
        </div>
      )}

      {/* Minha guild */}
      {myGuild && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(13,24,41,0.98) 100%)',
            border:     '1px solid rgba(59,130,246,0.25)',
          }}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}
              >
                {myGuild.avatar_emoji}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-md" style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>
                    [{myGuild.tag}]
                  </span>
                  <span className="text-base font-bold" style={{ color: '#fff' }}>{myGuild.name}</span>
                  {myRole === 'owner' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(245,200,66,0.1)', color: '#F5C842' }}>
                      <Crown size={9} /> Líder
                    </span>
                  )}
                  {myRole === 'moderator' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED' }}>
                      <Shield size={9} /> Mod
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[12px]" style={{ color: '#8899BB' }}>
                  <span className="flex items-center gap-1">
                    <Users size={10} /> {myGuild.member_count}/{myGuild.max_members}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap size={10} style={{ color: '#F5C842' }} />
                    <span style={{ color: '#F5C842' }}>{myGuild.weekly_xp.toLocaleString('pt-BR')} XP/sem</span>
                  </span>
                </div>
              </div>
            </div>
            {myRole !== 'owner' && (
              <button
                onClick={handleLeave}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: 'rgba(255,77,0,0.08)', color: '#FF4D00', border: '1px solid rgba(255,77,0,0.15)' }}
              >
                <LogOut size={12} /> Sair
              </button>
            )}
          </div>
          {myGuild.motto && (
            <p className="mt-3 text-sm italic" style={{ color: '#8899BB' }}>"{myGuild.motto}"</p>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8899BB' }} />
        <input
          type="text"
          placeholder="Buscar guilds..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{
            background:  'rgba(255,255,255,0.04)',
            border:      '1px solid rgba(255,255,255,0.08)',
            color:       '#fff',
          }}
        />
      </div>

      {/* Guilds list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-sm py-8" style={{ color: '#8899BB' }}>Nenhuma guild encontrada.</p>
        )}
        {filtered.map((g) => (
          <div
            key={g.id}
            className="rounded-2xl p-4 flex items-center gap-4"
            style={{
              background: g.is_member
                ? 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(13,24,41,0.98) 100%)'
                : 'rgba(255,255,255,0.025)',
              border: g.is_member
                ? '1px solid rgba(59,130,246,0.2)'
                : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {g.avatar_emoji}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.06)', color: '#8899BB' }}>
                  [{g.tag}]
                </span>
                <span className="font-bold text-sm truncate" style={{ color: '#fff' }}>{g.name}</span>
                {g.is_member && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88' }}>
                    Você está aqui
                  </span>
                )}
              </div>
              {g.motto && (
                <p className="text-xs mt-0.5 truncate" style={{ color: '#8899BB' }}>{g.motto}</p>
              )}
              <div className="flex items-center gap-3 mt-1 text-[11px]" style={{ color: '#8899BB' }}>
                <span className="flex items-center gap-1"><Users size={9} /> {g.member_count}/{g.max_members}</span>
                <span className="flex items-center gap-1">
                  <Zap size={9} style={{ color: '#F5C842' }} />
                  <span style={{ color: '#F5C842' }}>{g.weekly_xp.toLocaleString('pt-BR')} XP/sem</span>
                </span>
              </div>
            </div>

            {!g.is_member && !myGuildId && (
              <button
                onClick={() => handleJoin(g.id)}
                disabled={isPending}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: 'rgba(255,77,0,0.1)', color: '#FF4D00', border: '1px solid rgba(255,77,0,0.2)' }}
              >
                Entrar
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Note for level < 3 */}
      {!myGuildId && userLevel < 3 && (
        <p className="text-center text-xs" style={{ color: '#8899BB' }}>
          Alcance o nível 3 para criar sua própria guild.
        </p>
      )}

      {/* Create guild modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(5,9,20,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false) }}
        >
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md rounded-2xl p-6 space-y-4"
            style={{ background: '#0D1829', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <h2 className="text-lg font-black" style={{ color: '#fff' }}>Criar Nova Guild</h2>

            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-semibold" style={{ color: '#8899BB' }}>Nome da Guild</span>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={40}
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  placeholder="Nome da sua guild"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold" style={{ color: '#8899BB' }}>Tag (2-6 letras)</span>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={6}
                  value={form.tag}
                  onChange={(e) => setForm(f => ({ ...f, tag: e.target.value.toUpperCase() }))}
                  className="mt-1 w-full px-3 py-2 rounded-xl text-sm outline-none font-black tracking-widest"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5C842' }}
                  placeholder="TAG"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold" style={{ color: '#8899BB' }}>Motto (opcional)</span>
                <input
                  type="text"
                  maxLength={100}
                  value={form.motto}
                  onChange={(e) => setForm(f => ({ ...f, motto: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  placeholder="Nosso lema..."
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold" style={{ color: '#8899BB' }}>Emoji</span>
                <input
                  type="text"
                  maxLength={4}
                  value={form.avatar_emoji}
                  onChange={(e) => setForm(f => ({ ...f, avatar_emoji: e.target.value }))}
                  className="mt-1 w-24 px-3 py-2 rounded-xl text-center text-xl outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
              </label>
            </div>

            {error && (
              <p className="text-sm" style={{ color: '#FF4D00' }}>{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#8899BB', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ background: '#FF4D00', color: '#fff' }}
              >
                {isPending ? 'Criando...' : 'Criar Guild'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
