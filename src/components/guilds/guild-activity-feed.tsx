/**
 * GuildActivityFeed — feed social de conquistas recentes dos membros da guild.
 *
 * Research: accountability social aumenta conclusão de hábitos em 65% e a
 * chance de atingir metas em 95% (vs solo). Ver achievements dos colegas
 * cria pressão social positiva e FOMO saudável (estilo Habitica party feed).
 *
 * Segurança: `user_achievements` tem RLS user_id = auth.uid(), então usamos
 * o service client escopado APENAS aos memberIds desta guild. O page.tsx só
 * renderiza este componente quando o usuário é membro (fronteira de confiança).
 */

import { createServiceClient } from '@/lib/supabase/server';
import { Trophy } from 'lucide-react';

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

const RARITY_META: Record<Rarity, { label: string; color: string; rgb: string }> = {
  common: { label: 'Comum', color: '#8899BB', rgb: '136,153,187' },
  uncommon: { label: 'Incomum', color: '#00FF88', rgb: '0,255,136' },
  rare: { label: 'Raro', color: '#3B82F6', rgb: '59,130,246' },
  epic: { label: 'Épico', color: '#7C3AED', rgb: '124,58,237' },
  legendary: { label: 'Lendário', color: '#F5C842', rgb: '245,200,66' },
};

interface Member {
  user_id: string;
  profile: { name: string } | null;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ontem';
  return `há ${days}d`;
}

function firstName(name: string | undefined): string {
  return (name ?? 'Alguém').split(' ')[0] ?? 'Alguém';
}

export async function GuildActivityFeed({
  members,
  currentUserId,
}: {
  members: Member[];
  currentUserId: string;
}) {
  const memberIds = members.map((m) => m.user_id);
  if (memberIds.length === 0) return null;

  const nameMap = new Map(members.map((m) => [m.user_id, m.profile?.name]));

  const supabase = createServiceClient();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('user_achievements')
    .select('user_id, unlocked_at, achievements!inner(name, icon, rarity)')
    .in('user_id', memberIds)
    .gte('unlocked_at', fourteenDaysAgo)
    .order('unlocked_at', { ascending: false })
    .limit(25);

  type AchievementJoin = { name: string; icon: string; rarity: Rarity };
  const items = (data ?? []).map((row) => {
    const raw = row.achievements as unknown as AchievementJoin | AchievementJoin[];
    const a = Array.isArray(raw) ? raw[0] : raw;
    return {
      userId: row.user_id as string,
      unlockedAt: row.unlocked_at as string,
      name: a?.name ?? 'Conquista',
      icon: a?.icon ?? '🏆',
      rarity: (a?.rarity ?? 'common') as Rarity,
    };
  });

  return (
    <div
      className="space-y-3 rounded-2xl p-5"
      style={{ background: 'rgba(13,24,41,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-lg"
          style={{ background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.22)' }}
        >
          <Trophy size={12} style={{ color: '#F5C842' }} />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
          Atividade da Guild
        </span>
      </div>

      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-text-muted">
          Nenhuma conquista nos últimos 14 dias. Seja o primeiro — registre hábitos e treinos para
          aparecer aqui! 🔥
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => {
            const rarity = RARITY_META[item.rarity] ?? RARITY_META.common;
            const isMe = item.userId === currentUserId;
            const who = isMe ? 'Você' : firstName(nameMap.get(item.userId));
            return (
              <div
                key={`${item.userId}-${item.unlockedAt}-${idx}`}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{
                  background: `linear-gradient(135deg, rgba(${rarity.rgb},0.07) 0%, rgba(255,255,255,0.015) 100%)`,
                  border: `1px solid rgba(${rarity.rgb},0.16)`,
                }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
                  style={{
                    background: `rgba(${rarity.rgb},0.12)`,
                    border: `1px solid rgba(${rarity.rgb},0.22)`,
                  }}
                >
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm leading-snug">
                    <span className="font-bold" style={{ color: isMe ? '#00FF88' : '#fff' }}>
                      {who}
                    </span>
                    <span className="text-text-secondary"> desbloqueou </span>
                    <span className="font-bold" style={{ color: rarity.color }}>
                      {item.name}
                    </span>
                  </p>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: rarity.color }}
                  >
                    {rarity.label}
                  </span>
                </div>
                <span className="shrink-0 text-[10px] text-text-muted">
                  {relativeTime(item.unlockedAt)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
