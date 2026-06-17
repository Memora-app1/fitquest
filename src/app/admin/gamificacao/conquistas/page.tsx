import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAdminSession, hasMinRole } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { Trophy, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

const RARITY_COLORS: Record<string, string> = {
  common: '#8899BB',
  rare: '#3B82F6',
  epic: '#7C3AED',
  legendary: '#F5C842',
};
const RARITY_LABELS: Record<string, string> = {
  common: 'Comum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
};

export default async function AchievementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = await getAdminSession(user);
  if (!session || !hasMinRole(session, 'analyst')) redirect('/admin');

  const db = createServiceClient();

  const [achievementsRes, unlocksCountRes] = await Promise.all([
    db.from('achievements').select('*').order('category').order('xp_reward', { ascending: false }).limit(500),
    db.from('user_achievements').select('achievement_id').limit(10000),
  ]);

  const achievements = achievementsRes.data ?? [];

  // Contar quantas vezes cada conquista foi desbloqueada
  const unlockCounts: Record<string, number> = {};
  for (const ua of unlocksCountRes.data ?? []) {
    if (ua.achievement_id) {
      unlockCounts[ua.achievement_id] = (unlockCounts[ua.achievement_id] ?? 0) + 1;
    }
  }

  // Agrupar por categoria
  const byCategory: Record<string, typeof achievements> = {};
  for (const a of achievements) {
    const cat = a.category ?? 'outros';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat]!.push(a);
  }

  const totalUnlocks = Object.values(unlockCounts).reduce((s, v) => s + v, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black" style={{ color: '#fff' }}>
            <Trophy size={20} style={{ color: '#7C3AED' }} /> Conquistas
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: '#8899BB' }}>
            {achievements.length} conquistas · {totalUnlocks.toLocaleString('pt-BR')} desbloqueios
            totais
          </p>
        </div>
      </div>

      {/* Resumo por raridade */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(RARITY_LABELS).map(([rarity, label]) => {
          const count = achievements.filter((a) => a.rarity === rarity).length;
          const unlocks = achievements
            .filter((a) => a.rarity === rarity)
            .reduce((s, a) => s + (unlockCounts[a.id] ?? 0), 0);
          const color = RARITY_COLORS[rarity] ?? '#8899BB';
          return (
            <div
              key={rarity}
              className="rounded-xl p-3 text-center"
              style={{
                background: `rgba(${hexToRgb(color)},0.06)`,
                border: `1px solid rgba(${hexToRgb(color)},0.2)`,
              }}
            >
              <div className="text-lg font-black" style={{ color }}>
                {count}
              </div>
              <div className="text-xs font-bold" style={{ color }}>
                {label}
              </div>
              <div className="mt-0.5 text-[10px]" style={{ color: '#8899BB' }}>
                {unlocks.toLocaleString('pt-BR')} desbloqueios
              </div>
            </div>
          );
        })}
      </div>

      {/* Lista por categoria */}
      {Object.entries(byCategory).map(([category, achs]) => (
        <div key={category}>
          <h2
            className="mb-3 text-sm font-bold uppercase tracking-wider"
            style={{ color: '#8899BB' }}
          >
            {category}
          </h2>
          <div className="space-y-2">
            {achs.map((a) => {
              const color = RARITY_COLORS[a.rarity] ?? '#8899BB';
              const unlocks = unlockCounts[a.id] ?? 0;
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-4 rounded-xl p-4"
                  style={{
                    background: `rgba(${hexToRgb(color)},0.04)`,
                    border: `1px solid rgba(${hexToRgb(color)},0.12)`,
                  }}
                >
                  <div className="shrink-0 text-2xl">{a.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: '#fff' }}>
                        {a.name}
                      </span>
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                        style={{ background: `rgba(${hexToRgb(color)},0.12)`, color }}
                      >
                        {RARITY_LABELS[a.rarity]}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs" style={{ color: '#8899BB' }}>
                      {a.description}
                    </p>
                    <div
                      className="mt-1 flex items-center gap-3 text-[11px]"
                      style={{ color: '#8899BB' }}
                    >
                      <span>
                        trigger:{' '}
                        <span style={{ color: '#fff' }}>
                          {a.trigger_type} = {a.trigger_value}
                        </span>
                      </span>
                      <span style={{ color: '#F5C842' }}>+{a.xp_reward} XP</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div
                      className="flex items-center gap-1 text-sm font-black"
                      style={{ color: '#fff' }}
                    >
                      <Users size={12} style={{ color: '#8899BB' }} />
                      {unlocks.toLocaleString('pt-BR')}
                    </div>
                    <div className="text-[10px]" style={{ color: '#8899BB' }}>
                      desbloqueios
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function hexToRgb(hex: string | undefined): string {
  const h = hex ?? '#8899BB';
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
