'use client';

/**
 * ShareScoreButton — Web Share API no mobile com imagem OG real.
 * No desktop abre a imagem em nova aba + copia texto.
 */

import { useState } from 'react';
import { Share2, Check, Image } from 'lucide-react';

interface Props {
  userId: string;
  level: number;
  levelTitle: string;
  xpTotal: number;
  streak: number;
  achievements: number;
}

export function ShareScoreButton({
  userId,
  level,
  levelTitle,
  xpTotal,
  streak,
  achievements,
}: Props) {
  const [state, setState] = useState<'idle' | 'copied' | 'opening'>('idle');

  const LEVEL_EMOJIS: Record<number, string> = {
    1: '🌱',
    2: '🥉',
    3: '🥈',
    4: '🥇',
    5: '⚔️',
    6: '🛡️',
    7: '🏛️',
    8: '👑',
  };
  const emoji = LEVEL_EMOJIS[level] ?? '⚡';

  const ogUrl = `/api/og?uid=${userId}`;

  const shareText = [
    `${emoji} Nível ${level} — ${levelTitle} no Ascendia`,
    ``,
    `⚡ ${xpTotal.toLocaleString('pt-BR')} XP acumulados`,
    streak > 0 ? `🔥 ${streak} dias de sequência` : null,
    achievements > 0
      ? `🏆 ${achievements} conquista${achievements !== 1 ? 's' : ''} desbloqueada${achievements !== 1 ? 's' : ''}`
      : null,
    ``,
    `Gamifiquei minha academia, produtividade e finanças no mesmo app.`,
    `👉 ascendia.app`,
  ]
    .filter(Boolean)
    .join('\n');

  async function handleShare() {
    if (navigator.share) {
      try {
        // Tenta compartilhar com imagem real via fetch+blob
        const appUrl = window.location.origin;
        const imageRes = await fetch(`${appUrl}${ogUrl}`);
        if (imageRes.ok) {
          const blob = await imageRes.blob();
          const file = new File([blob], 'ascendia-score.png', { type: 'image/png' });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({
              title: `Meu score no Ascendia — Nível ${level}`,
              text: shareText,
              files: [file],
            });
            return;
          }
        }
        // Fallback: share sem imagem
        await navigator.share({ title: `Meu score no Ascendia — Nível ${level}`, text: shareText });
      } catch {
        /* silencioso */
      }
      return;
    }

    // Desktop: abre a imagem em nova aba + copia texto
    setState('opening');
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
      onClick={handleShare}
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:scale-105 active:scale-95"
      style={{
        background: 'rgba(124,58,237,0.12)',
        border: '1px solid rgba(124,58,237,0.3)',
        color: state === 'copied' ? '#00FF88' : '#9F5AF7',
      }}
      title="Compartilhar seu progresso"
    >
      {state === 'copied' ? (
        <>
          <Check size={13} style={{ color: '#00FF88' }} />
          <span style={{ color: '#00FF88' }}>Copiado!</span>
        </>
      ) : state === 'opening' ? (
        <>
          <Image size={13} />
          Abrindo imagem...
        </>
      ) : (
        <>
          <Share2 size={13} />
          Compartilhar
        </>
      )}
    </button>
  );
}
