'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getLevelInfo } from '@/lib/xp';
import {
  Users,
  Zap,
  Flame,
  Crown,
  Shield,
  Star,
  LogOut,
  Copy,
  Check,
  Trophy,
  Medal,
  ArrowLeft,
  ThumbsUp,
  Share2,
} from 'lucide-react';
import Link from 'next/link';

type Member = {
  user_id: string;
  role: string;
  joined_at: string;
  weekly_xp: number;
  last_week_xp: number;
  position: number;
  isCurrentUser: boolean;
  profile: {
    name: string;
    level: number;
    prestige_level: number;
    streak_current: number;
    equipped_title: string | null;
  } | null;
};

type Guild = {
  id: string;
  name: string;
  tag: string;
  motto: string | null;
  avatar_emoji: string;
  xp_total: number;
  weekly_xp: number;
  max_members: number;
  invite_code: string;
  is_public: boolean;
  created_by: string;
  created_at: string;
  member_count: number;
};

interface Props {
  data: {
    guild: Guild;
    members: Member[];
    myRole: string | null;
    isMember: boolean;
    isOwner: boolean;
  };
  /** Feed de atividade da guild (Server Component) renderizado no fim do fluxo. */
  feed?: React.ReactNode;
}

const DEFAULT_ROLE: { label: string; color: string; icon: React.ElementType } = {
  label: 'Membro',
  color: '#8899BB',
  icon: Users,
};

const ROLE_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  owner: { label: 'Líder', color: '#F5C842', icon: Crown },
  moderator: { label: 'Mod', color: '#7C3AED', icon: Shield },
  member: DEFAULT_ROLE,
};

const POSITION_STYLES: Record<number, { bg: string; color: string; shadow: string }> = {
  1: { bg: 'rgba(245,200,66,0.15)', color: '#F5C842', shadow: '0 0 12px rgba(245,200,66,0.3)' },
  2: { bg: 'rgba(192,192,192,0.12)', color: '#C0C0C0', shadow: '' },
  3: { bg: 'rgba(205,127,50,0.12)', color: '#CD7F32', shadow: '' },
};

export function GuildDetailClient({ data, feed }: Props) {
  const { guild, members, myRole, isMember, isOwner } = data;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cheeringId, setCheeringId] = useState<string | null>(null);
  const [cheeredIds, setCheeredIds] = useState<Set<string>>(new Set());
  const [sharingGuild, setSharingGuild] = useState(false);

  function copyInvite() {
    navigator.clipboard.writeText(guild.invite_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleJoin() {
    setError('');
    startTransition(async () => {
      const res = await fetch(`/api/guilds/${guild.id}/join`, { method: 'POST' });
      const d = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok) {
        setError(d.message ?? d.error ?? 'Erro ao entrar');
        return;
      }
      setSuccess(d.message ?? 'Bem-vindo à guild!');
      router.refresh();
    });
  }

  function handleLeave() {
    if (!confirm('Tem certeza que quer sair da guild?')) return;
    setError('');
    startTransition(async () => {
      const res = await fetch(`/api/guilds/${guild.id}`, { method: 'DELETE' });
      const d = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok) {
        setError(d.message ?? d.error ?? 'Erro ao sair');
        return;
      }
      router.push('/guilds');
    });
  }

  async function handleShareGuild() {
    if (sharingGuild) return;
    const ogUrl = `/api/og/guild?gid=${guild.id}`;
    const joinUrl = `${window.location.origin}/guilds/${guild.invite_code}`;
    const shareText = [
      `${guild.avatar_emoji} Entra na minha guild [${guild.tag}] ${guild.name} no Ascendia!`,
      ``,
      `Subimos de nível em equipe — fitness, produtividade e finanças gamificados.`,
      `👉 ${joinUrl}`,
    ].join('\n');

    setError('');
    setSuccess('');
    setSharingGuild(true);

    if (navigator.share) {
      try {
        const imageRes = await fetch(`${window.location.origin}${ogUrl}`);
        if (imageRes.ok) {
          const blob = await imageRes.blob();
          const file = new File([blob], 'ascendia-guild.png', { type: 'image/png' });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ title: `Guild ${guild.name}`, text: shareText, files: [file] });
            setSharingGuild(false);
            return;
          }
        }
        await navigator.share({ title: `Guild ${guild.name}`, text: shareText, url: joinUrl });
      } catch {
        /* cancelado/falhou — silencioso */
      }
      setSharingGuild(false);
      return;
    }

    // Desktop: abre imagem + copia convite
    window.open(ogUrl, '_blank');
    try {
      await navigator.clipboard.writeText(shareText);
      setSuccess('Convite copiado! 📋');
    } catch {
      /* clipboard indisponível */
    }
    setSharingGuild(false);
  }

  function handleCheer(targetUserId: string) {
    if (cheeringId || cheeredIds.has(targetUserId)) return;
    setError('');
    setSuccess('');
    setCheeringId(targetUserId);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/guilds/${guild.id}/cheer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId }),
        });
        const d = (await res.json()) as { ok?: boolean; message?: string; error?: string };
        if (res.ok && d.ok) {
          setCheeredIds((prev) => new Set(prev).add(targetUserId));
          setSuccess(d.message ?? 'Aplauso enviado! 👏');
          if (navigator.vibrate) navigator.vibrate([20, 15, 30]);
        } else {
          setError(d.message ?? d.error ?? 'Não foi possível aplaudir agora.');
        }
      } catch {
        setError('Não foi possível aplaudir agora.');
      } finally {
        setCheeringId(null);
      }
    });
  }

  const posStyle = (pos: number) =>
    POSITION_STYLES[pos] ?? { bg: 'transparent', color: '#8899BB', shadow: '' };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      {/* Back */}
      <Link
        href="/guilds"
        className="flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-white"
      >
        <ArrowLeft size={15} /> Todas as Guilds
      </Link>

      {/* Guild header */}
      <div
        className="space-y-4 rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.98) 100%)',
          border: '1px solid rgba(124,58,237,0.25)',
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl"
            style={{
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.3)',
            }}
          >
            {guild.avatar_emoji}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded px-2 py-0.5 text-[11px] font-black"
                style={{
                  background: 'rgba(124,58,237,0.2)',
                  color: '#7C3AED',
                  border: '1px solid rgba(124,58,237,0.3)',
                }}
              >
                [{guild.tag}]
              </span>
              <h1 className="text-xl font-black text-white">{guild.name}</h1>
            </div>
            {guild.motto && <p className="mt-1 text-sm italic text-text-muted">"{guild.motto}"</p>}

            <div className="mt-3 flex flex-wrap gap-4">
              <div className="flex items-center gap-1.5 text-sm">
                <Users size={13} className="text-text-muted" />
                <span className="text-text-muted">{guild.member_count}</span>
                <span className="text-xs text-text-muted">/ {guild.max_members}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Zap size={13} style={{ color: '#F5C842' }} />
                <span style={{ color: '#F5C842' }} className="font-bold">
                  {guild.weekly_xp.toLocaleString('pt-BR')} XP
                </span>
                <span className="text-xs text-text-muted">esta semana</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Trophy size={13} className="text-brand-orange" />
                <span className="text-text-muted">
                  {guild.xp_total.toLocaleString('pt-BR')} total
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Invite code + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={copyInvite}
              className="flex items-center gap-2 text-xs text-text-muted transition-colors hover:text-white"
            >
              {copied ? <Check size={13} className="text-brand-green" /> : <Copy size={13} />}
              Código:{' '}
              <span className="font-black tracking-widest text-white">{guild.invite_code}</span>
            </button>
            <button
              onClick={handleShareGuild}
              disabled={sharingGuild}
              aria-label="Compartilhar guild"
              title="Compartilhar guild para convidar membros"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
              style={{
                background: 'rgba(124,58,237,0.12)',
                border: '1px solid rgba(124,58,237,0.3)',
                color: '#9F5AF7',
              }}
            >
              <Share2 size={12} /> Convidar
            </button>
          </div>

          {isMember ? (
            !isOwner && (
              <button
                onClick={handleLeave}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
                style={{
                  background: 'rgba(255,77,0,0.08)',
                  color: '#FF4D00',
                  border: '1px solid rgba(255,77,0,0.15)',
                }}
              >
                <LogOut size={12} /> Sair da guild
              </button>
            )
          ) : (
            <button
              onClick={handleJoin}
              disabled={isPending || guild.member_count >= guild.max_members}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: '#7C3AED', color: '#fff' }}
            >
              {isPending
                ? 'Entrando...'
                : guild.member_count >= guild.max_members
                  ? 'Guild cheia'
                  : 'Entrar na Guild'}
            </button>
          )}
        </div>

        {(error || success) && (
          <div
            className="rounded-xl p-2.5 text-sm"
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
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted">
          <Medal size={14} />
          Ranking Semanal
        </h2>

        <div className="space-y-2">
          {members.map((member) => {
            const ps = posStyle(member.position);
            const lvInfo = getLevelInfo(member.profile?.level ?? 1);
            const role = (ROLE_LABELS[member.role] ?? ROLE_LABELS['member'])!;
            const RoleIcon = role.icon;

            return (
              <div
                key={member.user_id}
                className="flex items-center gap-3 rounded-xl p-3.5 transition-all"
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
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black"
                  style={{ background: ps.bg, color: ps.color }}
                >
                  {member.position}
                </div>

                {/* Avatar placeholder with initials */}
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black"
                  style={{
                    background: `linear-gradient(135deg, ${member.isCurrentUser ? '#FF4D00' : '#7C3AED'}, ${member.isCurrentUser ? '#7C3AED' : '#3B82F6'})`,
                    color: '#fff',
                  }}
                >
                  {(member.profile?.name ?? '?').slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-white">
                      {member.profile?.name ?? 'Usuário'}
                      {member.isCurrentUser && (
                        <span className="ml-1 text-xs text-brand-orange">(você)</span>
                      )}
                    </span>

                    {member.profile?.equipped_title && (
                      <span
                        className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                        style={{
                          background: 'rgba(245,200,66,0.1)',
                          color: '#F5C842',
                          border: '1px solid rgba(245,200,66,0.2)',
                        }}
                      >
                        {member.profile.equipped_title}
                      </span>
                    )}

                    <span
                      className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
                      style={{ color: role.color, background: `${role.color}18` }}
                    >
                      <RoleIcon size={8} className="mr-0.5 inline" />
                      {role.label}
                    </span>
                  </div>

                  <div className="mt-0.5 flex items-center gap-2.5">
                    <span className="text-[11px] text-text-muted">
                      {lvInfo.emoji} Nv {member.profile?.level ?? 1}
                    </span>
                    {(member.profile?.streak_current ?? 0) > 0 && (
                      <span className="flex items-center gap-0.5 text-[11px]">
                        <Flame size={9} className="text-brand-orange" />
                        <span className="font-bold text-brand-orange">
                          {member.profile!.streak_current}
                        </span>
                      </span>
                    )}
                    {member.profile?.prestige_level && member.profile.prestige_level > 0 ? (
                      <span className="flex items-center gap-0.5 text-[11px]">
                        <Star size={9} style={{ color: '#F5C842' }} />
                        <span style={{ color: '#F5C842' }} className="font-bold">
                          P{member.profile.prestige_level}
                        </span>
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* XP */}
                <div className="shrink-0 text-right">
                  <div className="text-sm font-black" style={{ color: '#F5C842' }}>
                    {(member.weekly_xp ?? 0).toLocaleString('pt-BR')}
                  </div>
                  <div className="text-[10px] text-text-muted">XP/sem</div>
                </div>

                {/* Aplaudir (só membros, em outros membros) */}
                {isMember && !member.isCurrentUser && (
                  <button
                    type="button"
                    onClick={() => handleCheer(member.user_id)}
                    disabled={cheeringId === member.user_id || cheeredIds.has(member.user_id)}
                    aria-label={`Aplaudir ${member.profile?.name ?? 'membro'}`}
                    title="Aplaudir membro"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95 disabled:cursor-default"
                    style={{
                      background: cheeredIds.has(member.user_id)
                        ? 'rgba(0,255,136,0.12)'
                        : 'rgba(124,58,237,0.1)',
                      border: cheeredIds.has(member.user_id)
                        ? '1px solid rgba(0,255,136,0.35)'
                        : '1px solid rgba(124,58,237,0.25)',
                      color: cheeredIds.has(member.user_id) ? '#00FF88' : '#9F5AF7',
                      opacity: cheeringId === member.user_id ? 0.6 : 1,
                    }}
                  >
                    {cheeredIds.has(member.user_id) ? <Check size={15} /> : <ThumbsUp size={15} />}
                  </button>
                )}
              </div>
            );
          })}

          {members.length === 0 && (
            <div className="py-10 text-center">
              <Users size={32} className="mx-auto mb-2 text-text-muted opacity-40" />
              <p className="text-sm text-text-muted">Nenhum membro ainda</p>
            </div>
          )}
        </div>
      </div>

      {/* Feed de atividade (apenas membros) */}
      {feed}
    </div>
  );
}
