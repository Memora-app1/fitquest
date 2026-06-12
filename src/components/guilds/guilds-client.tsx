'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Trophy,
  Zap,
  Search,
  Plus,
  Shield,
  Crown,
  LogOut,
  Copy,
  Check,
  ChevronRight,
} from 'lucide-react';

interface Guild {
  id: string;
  name: string;
  tag: string;
  motto: string | null;
  avatar_emoji: string;
  xp_total: number;
  weekly_xp: number;
  max_members: number;
  invite_code: string;
  member_count: number;
  is_member: boolean;
}

interface GuildsClientProps {
  guilds: Guild[];
  myGuildId: string | null;
  myRole: string | null;
  userLevel: number;
}

const EMOJI_OPTIONS = [
  '⚡',
  '🔥',
  '⚔️',
  '🛡️',
  '🏆',
  '💎',
  '👑',
  '🌙',
  '⭐',
  '🦅',
  '🐉',
  '🌊',
  '🎯',
  '🧠',
  '💪',
  '🚀',
  '🌀',
  '🍀',
];

function formatXP(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function GuildsClient({ guilds, myGuildId, myRole, userLevel }: GuildsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  const [form, setForm] = useState({
    name: '',
    tag: '',
    motto: '',
    avatar_emoji: '⚡',
  });

  const myGuild = guilds.find((g) => g.id === myGuildId) ?? null;
  const filtered = guilds.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.tag.toLowerCase().includes(search.toLowerCase())
  );

  function flash(type: 'error' | 'success', msg: string) {
    if (type === 'error') {
      setError(msg);
      setSuccess(null);
    } else {
      setSuccess(msg);
      setError(null);
    }
  }

  async function joinById(guildId: string) {
    setJoiningId(guildId);
    setError(null);
    try {
      const res = await fetch(`/api/guilds/${guildId}/join`, { method: 'POST' });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) flash('error', data.message ?? 'Erro ao entrar na guild.');
      else {
        flash('success', data.message ?? 'Você entrou na guild!');
        startTransition(() => router.refresh());
      }
    } catch {
      flash('error', 'Erro de conexão.');
    }
    setJoiningId(null);
  }

  async function joinByCode() {
    if (!inviteCode.trim()) return;
    setError(null);
    try {
      const res = await fetch(`/api/guilds/${inviteCode.trim().toUpperCase()}/join`, {
        method: 'POST',
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) flash('error', data.message ?? 'Código inválido ou guild cheia.');
      else {
        flash('success', data.message ?? 'Você entrou na guild!');
        setInviteCode('');
        startTransition(() => router.refresh());
      }
    } catch {
      flash('error', 'Erro de conexão.');
    }
  }

  async function leaveGuild() {
    if (!myGuildId) return;
    if (!confirm('Tem certeza que quer sair da guild?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/guilds/${myGuildId}`, { method: 'DELETE' });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) flash('error', data.message ?? 'Erro ao sair da guild.');
      else {
        flash('success', 'Você saiu da guild.');
        startTransition(() => router.refresh());
      }
    } catch {
      flash('error', 'Erro de conexão.');
    }
  }

  async function createGuild() {
    if (!form.name.trim() || !form.tag.trim()) {
      flash('error', 'Nome e tag são obrigatórios.');
      return;
    }
    setCreateLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/guilds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) flash('error', data.message ?? 'Erro ao criar guild.');
      else {
        flash('success', data.message ?? 'Guild criada!');
        setShowCreate(false);
        startTransition(() => router.refresh());
      }
    } catch {
      flash('error', 'Erro de conexão.');
    }
    setCreateLoading(false);
  }

  function copyInvite(code: string) {
    navigator.clipboard.writeText(code).catch(() => null);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl uppercase tracking-widest text-white">Guilds</h1>
        <p className="mt-1 text-sm text-[#8899BB]">
          Entre em um clã, conquiste em grupo e domine o ranking.
        </p>
      </div>

      {/* Feedback */}
      {error && (
        <div className="rounded-xl border border-[#FF4444]/30 bg-[#FF4444]/10 px-4 py-3 text-sm text-[#FF4444]">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-[#00FF88]/30 bg-[#00FF88]/10 px-4 py-3 text-sm text-[#00FF88]">
          {success}
        </div>
      )}

      {/* Minha Guild */}
      {myGuild && (
        <div
          className="space-y-4 rounded-2xl border border-[#1F2D45] bg-[#0D1829] p-5"
          style={{ boxShadow: '0 0 40px rgba(124,58,237,0.08)' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8899BB]">
              Minha Guild
            </h2>
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                myRole === 'owner'
                  ? 'bg-[#F5C842]/20 text-[#F5C842]'
                  : myRole === 'admin'
                    ? 'bg-[#7C3AED]/20 text-[#7C3AED]'
                    : 'bg-[#152238] text-[#5A6B85]'
              }`}
            >
              {myRole === 'owner' && (
                <>
                  <Crown size={10} /> Líder
                </>
              )}
              {myRole === 'admin' && (
                <>
                  <Shield size={10} /> Admin
                </>
              )}
              {myRole === 'member' && 'Membro'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-[#152238] text-3xl">
              {myGuild.avatar_emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-[#152238] px-2 py-0.5 font-mono text-xs text-[#5A6B85]">
                  [{myGuild.tag}]
                </span>
                <span className="truncate text-lg font-bold text-white">{myGuild.name}</span>
              </div>
              {myGuild.motto && (
                <p className="mt-0.5 truncate text-sm italic text-[#8899BB]">"{myGuild.motto}"</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1 text-xs text-[#8899BB]">
                  <Users size={12} />
                  {myGuild.member_count}/{myGuild.max_members} membros
                </span>
                <span className="flex items-center gap-1 text-xs text-[#F5C842]">
                  <Zap size={12} />
                  {formatXP(myGuild.weekly_xp)} XP semana
                </span>
                <span className="flex items-center gap-1 text-xs text-[#5A6B85]">
                  <Trophy size={12} />
                  {formatXP(myGuild.xp_total)} total
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#1F2D45] pt-3">
            <button
              onClick={() => copyInvite(myGuild.invite_code)}
              className="flex items-center gap-2 text-sm text-[#8899BB] transition-colors hover:text-white"
            >
              {copiedInvite ? (
                <>
                  <Check size={14} className="text-[#00FF88]" /> Copiado!
                </>
              ) : (
                <>
                  <Copy size={14} /> Invite: {myGuild.invite_code}
                </>
              )}
            </button>
            {myRole !== 'owner' && (
              <button
                onClick={leaveGuild}
                className="flex items-center gap-1.5 text-sm text-[#FF4444]/60 transition-colors hover:text-[#FF4444]"
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
          <div className="rounded-2xl border border-[#1F2D45] bg-[#0D1829] p-4">
            <p className="mb-2 text-xs text-[#8899BB]">Tem um código de convite?</p>
            <div className="flex gap-2">
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="XXXXXX"
                maxLength={8}
                className="flex-1 rounded-xl border border-[#1F2D45] bg-[#152238] px-3 py-2 font-mono text-sm uppercase text-white focus:border-[#7C3AED] focus:outline-none"
              />
              <button
                onClick={joinByCode}
                disabled={!inviteCode.trim() || isPending}
                className="rounded-xl bg-gradient-to-r from-[#FF4D00] to-[#7C3AED] px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              >
                Entrar
              </button>
            </div>
          </div>

          {/* Busca + criar */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6B85]"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar guild pelo nome ou tag..."
                className="w-full rounded-xl border border-[#1F2D45] bg-[#0D1829] py-2.5 pl-9 pr-3 text-sm text-white focus:border-[#7C3AED] focus:outline-none"
              />
            </div>
            {userLevel >= 3 ? (
              <button
                onClick={() => setShowCreate((v) => !v)}
                className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-[#FF4D00] to-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Plus size={15} />
                Criar Guild
              </button>
            ) : (
              <div className="flex cursor-not-allowed items-center gap-2 whitespace-nowrap rounded-xl border border-[#1F2D45] bg-[#152238] px-4 py-2.5 text-sm text-[#5A6B85]">
                <Plus size={15} />
                Nível 3+
              </div>
            )}
          </div>

          {/* Form criar guild */}
          {showCreate && (
            <div className="space-y-4 rounded-2xl border border-[#7C3AED]/30 bg-[#0D1829] p-5">
              <h3 className="font-bold text-white">Nova Guild</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs text-[#5A6B85]">Nome *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Phoenix Elite"
                    maxLength={40}
                    className="w-full rounded-xl border border-[#1F2D45] bg-[#152238] px-3 py-2.5 text-sm text-white focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#5A6B85]">Tag * (2–6 letras)</label>
                  <input
                    value={form.tag}
                    onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value.toUpperCase() }))}
                    placeholder="PHX"
                    maxLength={6}
                    className="w-full rounded-xl border border-[#1F2D45] bg-[#152238] px-3 py-2.5 font-mono text-sm uppercase text-white focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#5A6B85]">Emoji</label>
                  <select
                    value={form.avatar_emoji}
                    onChange={(e) => setForm((f) => ({ ...f, avatar_emoji: e.target.value }))}
                    className="w-full rounded-xl border border-[#1F2D45] bg-[#152238] px-3 py-2.5 text-sm text-white focus:border-[#7C3AED] focus:outline-none"
                  >
                    {EMOJI_OPTIONS.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs text-[#5A6B85]">Motto (opcional)</label>
                  <input
                    value={form.motto}
                    onChange={(e) => setForm((f) => ({ ...f, motto: e.target.value }))}
                    placeholder="Juntos somos imparáveis."
                    maxLength={100}
                    className="w-full rounded-xl border border-[#1F2D45] bg-[#152238] px-3 py-2.5 text-sm text-white focus:border-[#7C3AED] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl border border-[#1F2D45] bg-[#152238] px-4 py-2 text-sm text-[#8899BB] transition-colors hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={createGuild}
                  disabled={createLoading || !form.name.trim() || !form.tag.trim()}
                  className="rounded-xl bg-gradient-to-r from-[#FF4D00] to-[#7C3AED] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {createLoading ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>
          )}

          {/* Lista de guilds */}
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#8899BB]">
              {search
                ? `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`
                : `${filtered.length} guilds disponíveis`}
            </h2>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-[#1F2D45] bg-[#0D1829] p-12 text-center">
                <p className="mb-3 text-4xl">🏰</p>
                <p className="text-sm text-[#8899BB]">
                  {search ? 'Nenhuma guild encontrada.' : 'Nenhuma guild pública disponível ainda.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((guild, idx) => (
                  <div
                    key={guild.id}
                    className="flex items-center gap-3 rounded-2xl border border-[#1F2D45] bg-[#0D1829] p-4 transition-colors hover:border-[#7C3AED]/40"
                  >
                    {/* Rank */}
                    <div className="w-8 flex-shrink-0 text-center">
                      {idx === 0 && <span className="text-lg">🥇</span>}
                      {idx === 1 && <span className="text-lg">🥈</span>}
                      {idx === 2 && <span className="text-lg">🥉</span>}
                      {idx >= 3 && (
                        <span className="font-mono text-xs text-[#5A6B85]">#{idx + 1}</span>
                      )}
                    </div>

                    {/* Emoji */}
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#152238] text-2xl">
                      {guild.avatar_emoji}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[#5A6B85]">[{guild.tag}]</span>
                        <span className="truncate text-sm font-semibold text-white">
                          {guild.name}
                        </span>
                      </div>
                      {guild.motto && (
                        <p className="mt-0.5 truncate text-xs italic text-[#5A6B85]">
                          &ldquo;{guild.motto}&rdquo;
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-[#8899BB]">
                          <Users size={11} />
                          {guild.member_count}/{guild.max_members}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[#F5C842]">
                          <Zap size={11} />
                          {formatXP(guild.weekly_xp)}/sem
                        </span>
                      </div>
                    </div>

                    {/* Ação */}
                    <div className="flex-shrink-0">
                      {guild.member_count >= guild.max_members ? (
                        <span className="rounded-lg bg-[#152238] px-3 py-1.5 text-xs text-[#5A6B85]">
                          Cheia
                        </span>
                      ) : (
                        <button
                          onClick={() => joinById(guild.id)}
                          disabled={joiningId === guild.id || isPending}
                          className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#FF4D00] to-[#7C3AED] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          {joiningId === guild.id ? (
                            '...'
                          ) : (
                            <>
                              <span>Entrar</span>
                              <ChevronRight size={12} />
                            </>
                          )}
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
  );
}
