'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Clock, Lock, CheckCircle2, Gift, Star, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SeasonTier } from '@/lib/supabase/types';

interface SeasonData {
  id: string;
  name: string;
  theme_emoji: string;
  tagline: string | null;
  start_date: string;
  end_date: string;
  tiers: SeasonTier[];
  days_left: number;
  total_days: number;
}

interface ProgressData {
  season_xp: number;
  current_tier: number;
  claimed_tiers: number[];
  xp_to_next: number;
  progress_pct: number;
  next_tier: SeasonTier | null;
  is_paid: boolean;
}

interface Props {
  season: SeasonData;
  progress: ProgressData;
}

const TIER_TYPE_LABELS: Record<string, string> = {
  xp: '⚡ XP Bônus',
  streak_freeze: '🧊 Streak Freeze',
  title: '👑 Título',
  frame: '🖼️ Frame',
  badge: '🏅 Badge',
};

function TierCard({
  tier,
  claimed,
  unlocked,
  isAccessible,
  isCurrent,
  onClaim,
  isPending,
}: {
  tier: SeasonTier;
  claimed: boolean;
  unlocked: boolean;
  isAccessible: boolean;
  isCurrent: boolean;
  onClaim: (n: number) => void;
  isPending: boolean;
}) {
  const claimable = unlocked && !claimed && isAccessible;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-4 transition-all',
        isCurrent && 'ring-1'
      )}
      style={
        {
          background: claimed
            ? 'rgba(0,255,136,0.05)'
            : unlocked
              ? isAccessible
                ? 'rgba(124,58,237,0.08)'
                : 'rgba(255,255,255,0.025)'
              : 'rgba(255,255,255,0.02)',
          border: claimed
            ? '1px solid rgba(0,255,136,0.2)'
            : unlocked && isAccessible
              ? '1px solid rgba(124,58,237,0.3)'
              : '1px solid rgba(255,255,255,0.06)',
          '--tw-ring-color': isCurrent ? 'rgba(255,77,0,0.6)' : undefined,
        } as React.CSSProperties
      }
    >
      {/* Premium tag */}
      {!tier.free && (
        <div
          className="absolute right-3 top-3 flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-black"
          style={{
            background: 'rgba(245,200,66,0.12)',
            color: '#F5C842',
            border: '1px solid rgba(245,200,66,0.25)',
          }}
        >
          <Crown size={8} /> PRO
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Tier number + emoji */}
        <div
          className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl"
          style={{
            background: claimed
              ? 'rgba(0,255,136,0.1)'
              : unlocked
                ? 'rgba(124,58,237,0.15)'
                : 'rgba(255,255,255,0.04)',
            border: claimed
              ? '1px solid rgba(0,255,136,0.25)'
              : unlocked
                ? '1px solid rgba(124,58,237,0.3)'
                : '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span className="text-xl leading-none">{tier.emoji}</span>
          <span className="mt-0.5 text-[9px] font-black" style={{ color: '#8899BB' }}>
            T{tier.tier}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-1.5">
            <span
              className={cn(
                'text-sm font-bold',
                claimed
                  ? 'text-brand-green'
                  : unlocked && isAccessible
                    ? 'text-white'
                    : 'text-text-muted'
              )}
            >
              {tier.label}
            </span>
          </div>

          <div className="mt-0.5 flex items-center gap-1">
            <span
              className="rounded px-1.5 py-0.5 text-[10px]"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#8899BB' }}
            >
              {TIER_TYPE_LABELS[tier.type] ?? tier.type}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-1">
            <Zap size={9} style={{ color: '#F5C842' }} />
            <span className="text-[11px]" style={{ color: '#F5C842' }}>
              {tier.season_xp_required.toLocaleString('pt-BR')} XP Season
            </span>
          </div>
        </div>

        {/* Action */}
        <div className="shrink-0 self-center">
          {claimed ? (
            <CheckCircle2 size={20} className="text-brand-green" />
          ) : !unlocked ? (
            <Lock size={16} className="text-text-muted opacity-50" />
          ) : !isAccessible ? (
            <div className="flex flex-col items-center">
              <Lock size={14} style={{ color: '#F5C842' }} />
              <span className="mt-0.5 text-[8px] text-text-muted">PRO</span>
            </div>
          ) : (
            <button
              onClick={() => onClaim(tier.tier)}
              disabled={isPending}
              className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: '#7C3AED', color: '#fff' }}
            >
              <Gift size={11} />
              {isPending ? '...' : 'Resgatar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SeasonsClient({ season, progress }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [claimMsg, setClaimMsg] = useState('');
  const [claimError, setClaimError] = useState('');

  const daysPct = Math.round(((season.total_days - season.days_left) / season.total_days) * 100);

  function handleClaim(tierNum: number) {
    setClaimMsg('');
    setClaimError('');
    startTransition(async () => {
      const res = await fetch('/api/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierNum }),
      });
      const d = (await res.json()) as {
        ok?: boolean;
        reward_message?: string;
        error?: string;
        message?: string;
        xp_needed?: number;
      };
      if (!res.ok) {
        setClaimError(d.message ?? d.error ?? 'Erro ao resgatar');
        return;
      }
      setClaimMsg(`Recompensa resgatada: ${d.reward_message ?? '✓'}`);
      router.refresh();
    });
  }

  const tierCols = season.tiers.length > 6 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      {/* Season header */}
      <div
        className="space-y-4 rounded-2xl p-5"
        style={{
          background:
            'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.06) 100%)',
          border: '1px solid rgba(124,58,237,0.25)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-3xl">{season.theme_emoji}</span>
              <h1 className="text-xl font-black text-white">{season.name}</h1>
            </div>
            {season.tagline && <p className="text-sm italic text-text-muted">"{season.tagline}"</p>}
          </div>
          <div className="shrink-0 text-right">
            <div className="flex items-center justify-end gap-1">
              <Clock size={12} className="text-text-muted" />
              <span className="text-xs text-text-muted">{season.days_left}d restantes</span>
            </div>
          </div>
        </div>

        {/* Season time progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-text-muted">
            <span>Progresso da temporada</span>
            <span>{daysPct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${daysPct}%`,
                background: 'linear-gradient(90deg, #7C3AED, #FF4D00)',
              }}
            />
          </div>
        </div>

        {/* Season XP stats */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="text-center">
            <div className="text-lg font-black" style={{ color: '#F5C842' }}>
              {progress.season_xp.toLocaleString('pt-BR')}
            </div>
            <div className="text-[10px] text-text-muted">Season XP</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-white">T{progress.current_tier}</div>
            <div className="text-[10px] text-text-muted">Tier Atual</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-brand-orange">
              {progress.claimed_tiers.length}
            </div>
            <div className="text-[10px] text-text-muted">Resgates</div>
          </div>
        </div>

        {/* XP to next tier */}
        {progress.next_tier && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-text-muted">
                Próximo tier:{' '}
                <span className="font-bold text-white">
                  {progress.next_tier.emoji} {progress.next_tier.label}
                </span>
              </span>
              <span style={{ color: '#F5C842' }}>
                {progress.xp_to_next.toLocaleString('pt-BR')} XP restantes
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-bg">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress.progress_pct}%`,
                  background: 'linear-gradient(90deg, #F5C842, #FF4D00)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* PRO upsell for free users */}
      {!progress.is_paid && (
        <div
          className="flex items-center gap-3 rounded-2xl p-4"
          style={{ background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.2)' }}
        >
          <Star size={18} style={{ color: '#F5C842', flexShrink: 0 }} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-white">Desbloqueie todos os Tiers</div>
            <div className="text-xs text-text-muted">
              Usuários PRO têm acesso a recompensas exclusivas do battle pass.
            </div>
          </div>
          <a
            href="/planos"
            className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95"
            style={{
              background: 'rgba(245,200,66,0.15)',
              color: '#F5C842',
              border: '1px solid rgba(245,200,66,0.3)',
            }}
          >
            Ver planos
          </a>
        </div>
      )}

      {/* Feedback */}
      {(claimMsg || claimError) && (
        <div
          className="rounded-xl p-3 text-sm"
          style={{
            background: claimError ? 'rgba(255,77,0,0.1)' : 'rgba(0,255,136,0.08)',
            color: claimError ? '#FF4D00' : '#00FF88',
            border: `1px solid ${claimError ? 'rgba(255,77,0,0.2)' : 'rgba(0,255,136,0.15)'}`,
          }}
        >
          {claimError || claimMsg}
        </div>
      )}

      {/* Tiers */}
      <div className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-muted">
          <Gift size={14} />
          Battle Pass — {season.tiers.length} Tiers
        </h2>

        <div className={cn('grid gap-2', tierCols)}>
          {season.tiers.map((tier) => {
            const unlocked = progress.season_xp >= tier.season_xp_required;
            const claimed = progress.claimed_tiers.includes(tier.tier);
            const isAccessible = tier.free || progress.is_paid;
            const isCurrent = tier.tier === progress.current_tier;

            return (
              <TierCard
                key={tier.tier}
                tier={tier}
                claimed={claimed}
                unlocked={unlocked}
                isAccessible={isAccessible}
                isCurrent={isCurrent}
                onClaim={handleClaim}
                isPending={isPending}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
