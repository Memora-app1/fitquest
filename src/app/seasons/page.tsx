import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';
import { SeasonsClient } from '@/components/seasons/seasons-client';
import type { SeasonTier } from '@/lib/supabase/types';

export const metadata: Metadata = {
  title: 'Temporada',
  description: 'Battle Pass e recompensas da temporada ativa do Ascendia.',
};

export const dynamic = 'force-dynamic';

export default async function SeasonsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Temporada ativa
  const { data: season } = await supabase
    .from('seasons')
    .select('id, name, theme_emoji, tagline, start_date, end_date, tiers')
    .eq('is_active', true)
    .single();

  if (!season) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl space-y-4 px-4 py-16 text-center">
          <div className="text-5xl">🌙</div>
          <h1 className="text-2xl font-black text-white">Nenhuma Temporada Ativa</h1>
          <p className="text-text-muted">
            A próxima temporada começa em breve. Continue acumulando XP!
          </p>
        </div>
      </AppShell>
    );
  }

  // Progresso do usuário
  const { data: progress } = await supabase
    .from('season_progress')
    .select('season_xp, current_tier, claimed_tiers')
    .eq('user_id', user.id)
    .eq('season_id', season.id)
    .maybeSingle();

  // Subscription
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single();

  const tiers = (season.tiers as SeasonTier[]) ?? [];
  const seasonXp = (progress?.season_xp as number) ?? 0;
  const claimedTiers = (progress?.claimed_tiers as number[]) ?? [];
  const isPaid = ['active', 'lifetime'].includes((profile?.subscription_status as string) ?? '');

  const endDate = new Date(season.end_date as string);
  const startDate = new Date(season.start_date as string);
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000));
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000);

  const currentTier = tiers.reduce((highest, t) => {
    return seasonXp >= t.season_xp_required ? t.tier : highest;
  }, 0);

  const nextTier = tiers.find((t) => seasonXp < t.season_xp_required);
  const xpToNext = nextTier ? nextTier.season_xp_required - seasonXp : 0;
  const progressPct = nextTier
    ? Math.round(
        ((seasonXp - (tiers[currentTier - 1]?.season_xp_required ?? 0)) /
          (nextTier.season_xp_required - (tiers[currentTier - 1]?.season_xp_required ?? 0))) *
          100
      )
    : 100;

  return (
    <AppShell>
      <SeasonsClient
        season={{
          id: season.id as string,
          name: season.name as string,
          theme_emoji: season.theme_emoji as string,
          tagline: season.tagline as string | null,
          start_date: season.start_date as string,
          end_date: season.end_date as string,
          tiers,
          days_left: daysLeft,
          total_days: totalDays,
        }}
        progress={{
          season_xp: seasonXp,
          current_tier: currentTier,
          claimed_tiers: claimedTiers,
          xp_to_next: xpToNext,
          progress_pct: progressPct,
          next_tier: nextTier ?? null,
          is_paid: isPaid,
        }}
      />
    </AppShell>
  );
}
