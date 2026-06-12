import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAdminSession, hasMinRole } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { Trophy, Users, Zap, Calendar, CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SeasonPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = await getAdminSession(user);
  if (!session || !hasMinRole(session, 'admin')) redirect('/admin');

  const db = createServiceClient();

  const [seasonsRes, activeSeason] = await Promise.all([
    db.from('seasons').select('*').order('start_date', { ascending: false }),
    db
      .from('seasons')
      .select('id, name, theme_emoji, tagline, start_date, end_date, tiers')
      .eq('is_active', true)
      .single(),
  ]);

  const seasons = seasonsRes.data ?? [];

  // Participantes da temporada ativa
  const { count: activeParticipants } = await db
    .from('season_progress')
    .select('user_id', { count: 'exact', head: true })
    .eq('season_id', activeSeason.data?.id ?? '');

  // Top da temporada ativa
  const { data: topSeason } = await db
    .from('season_progress')
    .select('user_id, season_xp, current_tier, profiles(name, level)')
    .eq('season_id', activeSeason.data?.id ?? '')
    .order('season_xp', { ascending: false })
    .limit(10);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black" style={{ color: '#fff' }}>
          <Trophy size={20} style={{ color: '#F5C842' }} /> Temporadas
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: '#8899BB' }}>
          Gerencie o Season Pass do Ascendia.
        </p>
      </div>

      {/* Temporada ativa */}
      {activeSeason.data && (
        <div
          className="rounded-xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(245,200,66,0.08), rgba(13,24,41,0.98))',
            border: '1px solid rgba(245,200,66,0.25)',
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ background: 'rgba(0,255,136,0.15)', color: '#00FF88' }}
                >
                  ● Ativa
                </span>
              </div>
              <h2 className="text-xl font-black" style={{ color: '#fff' }}>
                {activeSeason.data.theme_emoji} {activeSeason.data.name}
              </h2>
              {activeSeason.data.tagline && (
                <p className="mt-1 text-sm italic" style={{ color: '#8899BB' }}>
                  "{activeSeason.data.tagline}"
                </p>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs" style={{ color: '#8899BB' }}>
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(activeSeason.data.start_date).toLocaleDateString('pt-BR')} →{' '}
                  {new Date(activeSeason.data.end_date).toLocaleDateString('pt-BR')}
                </div>
                <div className="flex items-center gap-1">
                  <Users size={12} />
                  {(activeParticipants ?? 0).toLocaleString('pt-BR')} participantes
                </div>
              </div>
            </div>

            {/* Botão finalizar season (super_admin only) */}
            {hasMinRole(session, 'super_admin') && (
              <form action="/api/admin/seasons/end-active" method="POST">
                <button
                  type="submit"
                  className="rounded-lg px-4 py-2 text-xs font-semibold"
                  style={{
                    background: 'rgba(255,77,0,0.1)',
                    color: '#FF4D00',
                    border: '1px solid rgba(255,77,0,0.2)',
                  }}
                  onClick={(e) => {
                    if (!confirm('Finalizar a temporada ativa? Esta ação não pode ser desfeita.'))
                      e.preventDefault();
                  }}
                >
                  Finalizar Temporada
                </button>
              </form>
            )}
          </div>

          {/* Top 10 da season */}
          {(topSeason ?? []).length > 0 && (
            <div className="mt-5 border-t pt-4" style={{ borderColor: 'rgba(245,200,66,0.15)' }}>
              <h3 className="mb-3 text-xs font-bold" style={{ color: '#8899BB' }}>
                Top 10 da Temporada
              </h3>
              <div className="space-y-1.5">
                {(topSeason ?? []).map((sp, i) => {
                  const profile = Array.isArray(sp.profiles)
                    ? (sp.profiles[0] as { name: string; level: number } | undefined)
                    : (sp.profiles as { name: string; level: number } | null);
                  return (
                    <div key={sp.user_id} className="flex items-center gap-3 text-xs">
                      <span
                        className="w-5 text-center font-black"
                        style={{ color: i < 3 ? '#F5C842' : '#8899BB' }}
                      >
                        {i + 1}
                      </span>
                      <span className="flex-1 font-medium" style={{ color: '#fff' }}>
                        {profile?.name ?? sp.user_id?.slice(0, 8)}
                      </span>
                      <span style={{ color: '#8899BB' }}>Tier {sp.current_tier}</span>
                      <span className="font-bold" style={{ color: '#F5C842' }}>
                        ⚡ {(sp.season_xp ?? 0).toLocaleString('pt-BR')} XP
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Criar nova temporada */}
      {hasMinRole(session, 'admin') && (
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="mb-4 text-sm font-bold" style={{ color: '#fff' }}>
            Criar Nova Temporada
          </h2>
          <form action="/api/admin/seasons" method="POST" className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                name="name"
                placeholder="Nome da temporada"
                required
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff',
                }}
              />
              <input
                name="theme_emoji"
                placeholder="Emoji do tema (ex: ⚔️)"
                maxLength={4}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff',
                }}
              />
            </div>
            <input
              name="tagline"
              placeholder="Tagline (opcional)"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff',
              }}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs" style={{ color: '#8899BB' }}>
                  Data início
                </label>
                <input
                  name="start_date"
                  type="date"
                  required
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs" style={{ color: '#8899BB' }}>
                  Data fim
                </label>
                <input
                  name="end_date"
                  type="date"
                  required
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-lg px-4 py-2 text-sm font-semibold"
                style={{ background: '#F5C842', color: '#050914' }}
              >
                Criar Temporada
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de todas as temporadas */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold" style={{ color: '#fff' }}>
          Histórico de Temporadas
        </h2>
        {seasons.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-3 rounded-xl p-4"
            style={{
              background: s.is_active ? 'rgba(245,200,66,0.04)' : 'rgba(255,255,255,0.025)',
              border: `1px solid ${s.is_active ? 'rgba(245,200,66,0.2)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{s.theme_emoji}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: '#fff' }}>
                    {s.name}
                  </span>
                  {s.is_active && (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                      style={{ background: 'rgba(0,255,136,0.15)', color: '#00FF88' }}
                    >
                      Ativa
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs" style={{ color: '#8899BB' }}>
                  {new Date(s.start_date).toLocaleDateString('pt-BR')} —{' '}
                  {new Date(s.end_date).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
            <div className="text-xs" style={{ color: '#8899BB' }}>
              {Array.isArray(s.tiers) ? s.tiers.length : 0} tiers
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
