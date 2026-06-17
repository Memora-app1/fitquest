'use client';

/**
 * AchievementShareButton — botão compacto para compartilhar uma conquista
 * já desbloqueada (share retroativo na página /conquistas).
 *
 * Reutiliza /api/og/achievement (mesma OG image do modal de unlock) e
 * o Web Share API com imagem real (File API), com fallback desktop.
 */

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface Props {
  slug: string;
  name: string;
  emoji: string;
  rarity: string;
  userId: string;
  color: string;
  rgb: string;
}

export function AchievementShareButton({ slug, name, emoji, rarity, userId, color, rgb }: Props) {
  const [state, setState] = useState<'idle' | 'sharing' | 'copied'>('idle');

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    const params = new URLSearchParams({
      slug,
      uid: userId,
      name,
      emoji,
      rarity,
    });
    const ogUrl = `/api/og/achievement?${params.toString()}`;
    const shareText = [
      `${emoji} Desbloqueei "${name}" no Ascendia!`,
      ``,
      `Gamifiquei minha academia, produtividade e finanças no mesmo app.`,
      `👉 ascendia.app`,
    ].join('\n');

    setState('sharing');

    if (navigator.share) {
      try {
        const imageRes = await fetch(`${window.location.origin}${ogUrl}`);
        if (imageRes.ok) {
          const blob = await imageRes.blob();
          const file = new File([blob], 'ascendia-conquista.png', { type: 'image/png' });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ title: `Conquista: ${name}`, text: shareText, files: [file] });
            setState('idle');
            return;
          }
        }
        await navigator.share({ title: `Conquista: ${name}`, text: shareText });
      } catch {
        /* cancelado/falhou — silencioso */
      }
      setState('idle');
      return;
    }

    // Desktop: abre imagem em nova aba + copia texto
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
      aria-label={`Compartilhar conquista ${name}`}
      title="Compartilhar conquista"
      className="flex h-7 w-7 items-center justify-center rounded-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-60"
      style={{
        background: state === 'copied' ? 'rgba(0,255,136,0.15)' : `rgba(${rgb},0.12)`,
        border: `1px solid ${state === 'copied' ? 'rgba(0,255,136,0.4)' : `rgba(${rgb},0.3)`}`,
        color: state === 'copied' ? '#00FF88' : color,
      }}
    >
      {state === 'copied' ? <Check size={13} /> : <Share2 size={13} />}
    </button>
  );
}
