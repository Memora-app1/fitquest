'use client';

/**
 * StreakShareButton — compartilha um marco de streak atingido.
 * Usado no card StreakMilestone (Server Component) num pico emocional
 * — momento ideal para virality. Reutiliza /api/og (card de score com
 * streak em destaque) + Web Share API com imagem real.
 */

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface Props {
  userId: string;
  days: number;
  title: string;
  color: string;
  rgb: string;
}

export function StreakShareButton({ userId, days, title, color, rgb }: Props) {
  const [state, setState] = useState<'idle' | 'sharing' | 'copied'>('idle');

  async function handleShare() {
    const ogUrl = `/api/og?uid=${userId}`;
    const shareText = [
      `🔥 ${days} dias de streak no Ascendia! ${title}`,
      ``,
      `Consistência diária em fitness, produtividade e finanças.`,
      `👉 ascendia.app`,
    ].join('\n');

    setState('sharing');

    if (navigator.share) {
      try {
        const imageRes = await fetch(`${window.location.origin}${ogUrl}`);
        if (imageRes.ok) {
          const blob = await imageRes.blob();
          const file = new File([blob], 'ascendia-streak.png', { type: 'image/png' });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ title: `${days} dias de streak!`, text: shareText, files: [file] });
            setState('idle');
            return;
          }
        }
        await navigator.share({ title: `${days} dias de streak!`, text: shareText });
      } catch {
        /* cancelado/falhou — silencioso */
      }
      setState('idle');
      return;
    }

    window.open(ogUrl, '_blank');
    try {
      await navigator.clipboard.writeText(shareText);
      setState('copied');
      setTimeout(() => setState('idle'), 2500);
    } catch {
      setState('idle');
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={state === 'sharing'}
      className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
      style={{
        background: state === 'copied' ? 'rgba(0,255,136,0.15)' : `rgba(${rgb},0.15)`,
        border: `1px solid ${state === 'copied' ? 'rgba(0,255,136,0.4)' : `rgba(${rgb},0.35)`}`,
        color: state === 'copied' ? '#00FF88' : color,
      }}
    >
      {state === 'copied' ? (
        <>
          <Check size={13} /> Copiado!
        </>
      ) : (
        <>
          <Share2 size={13} /> Compartilhar marco
        </>
      )}
    </button>
  );
}
