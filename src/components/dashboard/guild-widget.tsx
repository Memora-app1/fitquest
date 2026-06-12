/**
 * Guild Widget — mostra a guild do usuário no dashboard, ou convite para criar/entrar.
 * Server Component.
 */

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Users, Zap, TrendingUp } from 'lucide-react';

interface Props {
  userId: string;
}

export async function GuildWidget({ userId }: Props) {
  const supabase = await createClient();

  // Verifica se o usuário está em uma guild
  const { data: membership } = await supabase
    .from('guild_members')
    .select('guild_id, role, weekly_xp')
    .eq('user_id', userId)
    .maybeSingle();

  // Sem guild
  if (!membership) {
    return (
      <Link href="/guilds">
        <div
          className="relative cursor-pointer overflow-hidden rounded-2xl p-5 transition-transform hover:scale-[1.01]"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.1)',
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              ⚔️
            </div>
            <div>
              <p className="text-sm font-bold text-white">Sem guild ainda</p>
              <p className="mt-0.5 text-[11px] text-text-muted">
                Entre em um clã e conquiste juntos. Toque para explorar guilds.
              </p>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  const guildId = membership.guild_id as string;

  // Dados da guild
  const { data: guild } = await supabase
    .from('guilds')
    .select('name, tag, avatar_emoji, xp_total, weekly_xp')
    .eq('id', guildId)
    .single();

  if (!guild) return null;

  // Top 3 membros por XP semanal
  const { data: topMembers } = await supabase
    .from('guild_members')
    .select('user_id, weekly_xp')
    .eq('guild_id', guildId)
    .order('weekly_xp', { ascending: false })
    .limit(3);

  const memberIds = (topMembers ?? []).map((m) => m.user_id as string);
  const memberNames: Record<string, string> = {};
  if (memberIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', memberIds);
    for (const p of profiles ?? []) {
      memberNames[p.id as string] = (p.name as string).split(' ')[0] ?? '';
    }
  }

  const myWeeklyXp = (membership.weekly_xp as number) ?? 0;
  const guildWeekly = (guild.weekly_xp as number) ?? 0;

  return (
    <Link href={`/guilds/${guildId}`}>
      <div
        className="relative overflow-hidden rounded-2xl p-5 transition-transform hover:scale-[1.01]"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(13,24,41,0.98) 100%)',
          border: '1px solid rgba(59,130,246,0.18)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full blur-2xl"
          style={{ background: 'rgba(59,130,246,0.10)' }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="mb-3 flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
              style={{
                background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.25)',
              }}
            >
              {guild.avatar_emoji as string}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-black"
                  style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}
                >
                  [{guild.tag as string}]
                </span>
                <span className="truncate text-sm font-bold text-white">
                  {guild.name as string}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <TrendingUp size={10} style={{ color: '#00FF88' }} />
                  <span className="text-[10px] text-text-muted">
                    {guildWeekly.toLocaleString('pt-BR')} XP esta semana
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Minha contribuição */}
          <div
            className="mb-3 flex items-center justify-between rounded-xl p-2.5"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span className="text-[11px] text-text-muted">Minha contribuição</span>
            <div className="flex items-center gap-1">
              <Zap size={10} style={{ color: '#F5C842' }} fill="currentColor" />
              <span className="text-[11px] font-black" style={{ color: '#F5C842' }}>
                {myWeeklyXp.toLocaleString('pt-BR')} XP
              </span>
            </div>
          </div>

          {/* Top membros */}
          {topMembers && topMembers.length > 0 && (
            <div className="space-y-1.5">
              <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-text-muted">
                <Users size={9} /> Top desta semana
              </p>
              {topMembers.map((m, idx) => (
                <div key={m.user_id as string} className="flex items-center gap-2">
                  <span className="w-4 text-[10px] font-bold text-text-muted">#{idx + 1}</span>
                  <span className="flex-1 truncate text-[11px] text-white">
                    {memberNames[m.user_id as string] ?? '—'}
                    {m.user_id === userId ? ' (você)' : ''}
                  </span>
                  <span className="text-[10px] font-bold" style={{ color: '#F5C842' }}>
                    {(m.weekly_xp as number).toLocaleString('pt-BR')} XP
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
