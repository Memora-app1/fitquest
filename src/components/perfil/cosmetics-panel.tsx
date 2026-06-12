'use client';

/**
 * CosmeticsPanel — exibe e permite equipar títulos e frames desbloqueados.
 * Atualiza profiles.equipped_title / equipped_frame via PATCH /api/perfil.
 */

import { useState, useTransition } from 'react';
import { Sparkles, Check } from 'lucide-react';

type CosmeticType = 'title' | 'frame' | 'badge' | 'theme';
type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface OwnedCosmetic {
  cosmetic_id: string;
  slug: string;
  name: string;
  type: CosmeticType;
  rarity: Rarity;
  preview: string | null;
}

interface Props {
  cosmetics: OwnedCosmetic[];
  equippedTitle: string | null;
  equippedFrame: string | null;
}

const RARITY_META: Record<Rarity, { color: string; rgb: string; label: string }> = {
  common: { color: '#8899BB', rgb: '136,153,187', label: 'Comum' },
  rare: { color: '#3B82F6', rgb: '59,130,246', label: 'Raro' },
  epic: { color: '#7C3AED', rgb: '124,58,237', label: 'Épico' },
  legendary: { color: '#F5C842', rgb: '245,200,66', label: 'Lendário' },
};

export function CosmeticsPanel({ cosmetics, equippedTitle, equippedFrame }: Props) {
  const [currentTitle, setCurrentTitle] = useState(equippedTitle);
  const [currentFrame, setCurrentFrame] = useState(equippedFrame);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'title' | 'frame'>('title');

  const titles = cosmetics.filter((c) => c.type === 'title');
  const frames = cosmetics.filter((c) => c.type === 'frame');

  if (titles.length === 0 && frames.length === 0) return null;

  async function equip(type: 'title' | 'frame', value: string | null) {
    startTransition(async () => {
      const body = type === 'title' ? { equipped_title: value } : { equipped_frame: value };
      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        if (type === 'title') setCurrentTitle(value);
        else setCurrentFrame(value);
      }
    });
  }

  function CosmeticCard({ item, equipped }: { item: OwnedCosmetic; equipped: boolean }) {
    const meta = RARITY_META[item.rarity] ?? RARITY_META.common;
    return (
      <button
        onClick={() => equip(item.type as 'title' | 'frame', equipped ? null : item.name)}
        disabled={isPending}
        className="relative flex flex-col items-center gap-2 overflow-hidden rounded-xl p-3 text-center transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-60"
        style={{
          background: equipped
            ? `linear-gradient(135deg, rgba(${meta.rgb},0.18) 0%, rgba(13,24,41,0.98) 100%)`
            : `linear-gradient(135deg, rgba(${meta.rgb},0.06) 0%, rgba(13,24,41,0.98) 100%)`,
          border: equipped ? `1.5px solid rgba(${meta.rgb},0.55)` : `1px solid rgba(${meta.rgb},0.2)`,
          boxShadow: equipped ? `0 0 16px rgba(${meta.rgb},0.2)` : 'none',
        }}
      >
        {equipped && (
          <div
            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full"
            style={{ background: `rgba(${meta.rgb},0.25)` }}
          >
            <Check size={11} style={{ color: meta.color }} />
          </div>
        )}

        {/* Preview / Emoji */}
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
          style={{
            background: `rgba(${meta.rgb},0.12)`,
            border: `1px solid rgba(${meta.rgb},0.22)`,
          }}
        >
          {item.preview ?? (item.type === 'title' ? '🏷️' : '🖼️')}
        </div>

        <div className="w-full min-w-0">
          <div className="truncate text-xs font-bold leading-snug">{item.name}</div>
          <div className="mt-0.5 text-[9px] font-semibold" style={{ color: meta.color }}>
            {meta.label}
          </div>
        </div>

        {equipped && (
          <div
            className="rounded-full px-2 py-0.5 text-[9px] font-bold"
            style={{ background: `rgba(${meta.rgb},0.2)`, color: meta.color }}
          >
            Equipado
          </div>
        )}
      </button>
    );
  }

  const visibleItems = activeTab === 'title' ? titles : frames;

  return (
    <div
      className="animate-fade-in rounded-2xl p-5 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.04) 100%)',
        border: '1px solid rgba(124,58,237,0.18)',
      }}
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-lg"
          style={{
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.28)',
          }}
        >
          <Sparkles size={12} style={{ color: '#7C3AED' }} />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
          Cosméticos
        </span>
        <span className="ml-auto text-xs text-text-muted">{cosmetics.length} desbloqueados</span>
      </div>

      {/* Preview linha atual */}
      <div
        className="mb-4 flex flex-wrap gap-3 rounded-xl px-4 py-3"
        style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div>
          <div className="mb-0.5 text-[10px] uppercase tracking-wider text-text-muted">
            Título ativo
          </div>
          <div className="text-sm font-bold" style={{ color: '#7C3AED' }}>
            {currentTitle ?? '—'}
          </div>
        </div>
        {frames.length > 0 && (
          <>
            <div className="my-1 w-px self-stretch bg-white/10" />
            <div>
              <div className="mb-0.5 text-[10px] uppercase tracking-wider text-text-muted">
                Frame ativo
              </div>
              <div className="text-sm font-bold" style={{ color: '#F5C842' }}>
                {currentFrame ?? '—'}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      {titles.length > 0 && frames.length > 0 && (
        <div
          className="mb-4 flex gap-1 rounded-xl p-1"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          {(['title', 'frame'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 rounded-lg py-2 text-xs font-bold transition-all"
              style={
                activeTab === tab
                  ? {
                      background: 'rgba(124,58,237,0.25)',
                      border: '1px solid rgba(124,58,237,0.35)',
                      color: '#fff',
                    }
                  : { color: '#8899BB' }
              }
            >
              {tab === 'title' ? `🏷️ Títulos (${titles.length})` : `🖼️ Frames (${frames.length})`}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {visibleItems.length === 0 ? (
        <p className="py-4 text-center text-sm text-text-muted">
          Nenhum {activeTab === 'title' ? 'título' : 'frame'} desbloqueado ainda.
          <br />
          <span className="text-xs">Complete desafios da temporada para ganhar!</span>
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {visibleItems.map((item) => {
            const equipped =
              item.type === 'title' ? currentTitle === item.name : currentFrame === item.name;
            return <CosmeticCard key={item.cosmetic_id} item={item} equipped={equipped} />;
          })}
        </div>
      )}

      {isPending && (
        <p className="mt-3 text-center text-xs text-text-muted">Salvando...</p>
      )}
    </div>
  );
}
