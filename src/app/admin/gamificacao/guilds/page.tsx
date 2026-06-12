import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAdminSession, hasMinRole } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { Users, Zap, Shield } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function GuildsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = await getAdminSession(user);
  if (!session || !hasMinRole(session, 'analyst')) redirect('/admin');

  const params = await searchParams;
  const q = params.q ?? '';

  const db = createServiceClient();

  let query = db
    .from('guilds')
    .select(
      'id, name, tag, avatar_emoji, xp_total, weekly_xp, is_public, created_at, max_members, invite_code, guild_members(count)'
    )
    .order('xp_total', { ascending: false })
    .limit(50);

  if (q) query = query.ilike('name', `%${q}%`);

  const { data: guilds } = await query;

  const { count: totalGuilds } = await db
    .from('guilds')
    .select('id', { count: 'exact', head: true });

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black" style={{ color: '#fff' }}>
            <Shield size={20} style={{ color: '#7C3AED' }} /> Guilds
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: '#8899BB' }}>
            {(totalGuilds ?? 0).toLocaleString('pt-BR')} guilds no total
          </p>
        </div>
        <form method="GET" className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar guild..."
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#fff',
            }}
          />
          <button
            type="submit"
            className="rounded-lg px-3 py-2 text-sm font-semibold"
            style={{ background: '#7C3AED', color: '#fff' }}
          >
            Buscar
          </button>
        </form>
      </div>

      <div
        className="overflow-hidden rounded-xl"
        style={{ border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {['Guild', 'Tag', 'Membros', 'XP Total', 'XP Semanal', 'Tipo', 'Criada'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#8899BB' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(guilds ?? []).map((g, i) => {
              const memberCount = Array.isArray(g.guild_members)
                ? ((g.guild_members[0] as { count: number } | undefined)?.count ?? 0)
                : 0;

              return (
                <tr
                  key={g.id}
                  style={{
                    borderBottom:
                      i < (guilds?.length ?? 0) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{g.avatar_emoji}</span>
                      <span className="font-medium" style={{ color: '#fff' }}>
                        {g.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code
                      className="rounded px-1.5 py-0.5 font-mono text-xs"
                      style={{ background: 'rgba(124,58,237,0.15)', color: '#7C3AED' }}
                    >
                      [{g.tag}]
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs" style={{ color: '#fff' }}>
                      <Users size={11} style={{ color: '#8899BB' }} />
                      {memberCount}/{g.max_members}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="flex items-center gap-1 text-xs font-bold"
                      style={{ color: '#F5C842' }}
                    >
                      <Zap size={11} fill="currentColor" />
                      {(g.xp_total ?? 0).toLocaleString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold" style={{ color: '#00FF88' }}>
                    +{(g.weekly_xp ?? 0).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-1.5 py-0.5 text-xs font-bold"
                      style={{
                        background: g.is_public ? 'rgba(0,255,136,0.1)' : 'rgba(255,77,0,0.1)',
                        color: g.is_public ? '#00FF88' : '#FF4D00',
                      }}
                    >
                      {g.is_public ? 'Pública' : 'Privada'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#8899BB' }}>
                    {new Date(g.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              );
            })}
            {(guilds ?? []).length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm"
                  style={{ color: '#8899BB' }}
                >
                  Nenhuma guild encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
