'use client';

/**
 * AchievementShareModal — modal de celebração para conquistas épicas/lendárias.
 *
 * Dispara via o mesmo evento do toast:
 *   window.dispatchEvent(new CustomEvent('ascendia:achievement', { detail: { slug } }))
 *
 * O AchievementToast ignora épicas/lendárias (ver isShareWorthy) e deixa o modal
 * assumir essas conquistas de alto impacto — o momento de maior orgulho do usuário,
 * onde o compartilhamento social tem maior chance de conversão.
 */

import { useState, useEffect, useCallback } from 'react';
import { Share2, Check, X, Sparkles } from 'lucide-react';
import { ACHIEVEMENT_MAP, RARITY_STYLE, isShareWorthy, type AchievementMeta } from '@/lib/achievements';
import { useScrollLock } from '@/hooks/use-scroll-lock';

interface Props {
  userId: string;
}

export function AchievementShareModal({ userId }: Props) {
  const [slug, setSlug] = useState<string | null>(null);
  const [shareState, setShareState] = useState<'idle' | 'sharing' | 'copied'>('idle');
  const [visible, setVisible] = useState(false);

  // Trava o scroll do body enquanto o modal está aberto (evita scroll-behind no iOS)
  useScrollLock(!!slug);

  // Escuta conquistas e abre apenas para épicas/lendárias
  useEffect(() => {
    function handle(e: Event) {
      const ce = e as CustomEvent<{ slug: string }>;
      const s = ce.detail?.slug;
      const meta = s ? ACHIEVEMENT_MAP[s] : undefined;
      if (!meta || !isShareWorthy(meta.rarity)) return;
      setSlug(s);
      setShareState('idle');
      // tick para acionar a transição de entrada
      requestAnimationFrame(() => setVisible(true));
      // haptic forte de celebração
      if (navigator.vibrate) {
        if (meta.rarity === 'legendary') navigator.vibrate([80, 30, 150, 30, 200, 30, 250]);
        else navigator.vibrate([50, 20, 100, 20, 150]);
      }
    }
    window.addEventListener('ascendia:achievement', handle);
    return () => window.removeEventListener('ascendia:achievement', handle);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(() => setSlug(null), 280);
  }, []);

  // Fecha com ESC
  useEffect(() => {
    if (!slug) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slug, close]);

  const meta: AchievementMeta | null = (slug ? ACHIEVEMENT_MAP[slug] : null) ?? null;

  const handleShare = useCallback(async () => {
    if (!slug || !meta) return;
    const ogUrl = `/api/og/achievement?slug=${encodeURIComponent(slug)}&uid=${userId}`;
    const shareText = [
      `${meta.emoji} Desbloqueei "${meta.name}" no Ascendia!`,
      ``,
      `Gamifiquei minha academia, produtividade e finanças no mesmo app.`,
      `👉 ascendia.app`,
    ].join('\n');

    setShareState('sharing');

    if (navigator.share) {
      try {
        const imageRes = await fetch(`${window.location.origin}${ogUrl}`);
        if (imageRes.ok) {
          const blob = await imageRes.blob();
          const file = new File([blob], 'ascendia-conquista.png', { type: 'image/png' });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ title: `Conquista: ${meta.name}`, text: shareText, files: [file] });
            setShareState('idle');
            return;
          }
        }
        await navigator.share({ title: `Conquista: ${meta.name}`, text: shareText });
      } catch {
        /* usuário cancelou ou falhou — silencioso */
      }
      setShareState('idle');
      return;
    }

    // Desktop: abre a imagem em nova aba + copia texto
    window.open(ogUrl, '_blank');
    try {
      await navigator.clipboard.writeText(shareText);
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2500);
    } catch {
      setShareState('idle');
    }
  }, [slug, meta, userId]);

  if (!slug || !meta) return null;
  const style = RARITY_STYLE[meta.rarity];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-4"
      style={{
        background: 'rgba(5,9,20,0.82)',
        backdropFilter: 'blur(6px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.28s ease',
      }}
      onClick={close}
    >
      <div
        className="relative my-auto w-full max-w-sm overflow-hidden rounded-3xl text-center"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: `linear-gradient(160deg, rgba(${style.rgb},0.16) 0%, #0D1829 55%)`,
          border: `1px solid ${style.border}`,
          boxShadow: `0 24px 80px rgba(${style.rgb},0.28), 0 0 0 1px rgba(${style.rgb},0.1) inset`,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(12px)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.34s cubic-bezier(0.34,1.4,0.64,1), opacity 0.28s ease',
        }}
      >
        {/* Brilho radial atrás do badge */}
        <div
          className="pointer-events-none absolute left-1/2 top-16 h-56 w-56 -translate-x-1/2"
          style={{ background: `radial-gradient(circle, rgba(${style.rgb},0.35) 0%, transparent 70%)` }}
        />

        {/* Fechar */}
        <button
          type="button"
          onClick={close}
          className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-white/10"
          style={{ color: '#5A6B85' }}
          aria-label="Fechar"
        >
          <X size={18} />
        </button>

        <div className="relative px-7 pb-7 pt-9">
          {/* Selo de raridade */}
          <div className="mb-5 flex items-center justify-center gap-1.5">
            <Sparkles size={13} style={{ color: style.color }} />
            <span
              className="text-xs font-black uppercase tracking-[0.25em]"
              style={{ color: style.color }}
            >
              {style.label}
            </span>
            <Sparkles size={13} style={{ color: style.color }} />
          </div>

          {/* Badge emoji */}
          <div
            className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full text-6xl"
            style={{
              background: `radial-gradient(circle, rgba(${style.rgb},0.18) 0%, rgba(13,24,41,0.9) 72%)`,
              border: `3px solid ${style.color}`,
              boxShadow: `0 0 50px rgba(${style.rgb},0.4)`,
              animation: 'achievementPop 0.5s cubic-bezier(0.34,1.5,0.64,1) both',
            }}
          >
            {meta.emoji}
          </div>

          <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-[#8899BB]">
            Conquista desbloqueada
          </div>
          <h2 className="mb-2 text-2xl font-black leading-tight text-white">{meta.name}</h2>

          {meta.xp > 0 && (
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-[rgba(245,200,66,0.12)] px-3 py-1">
              <Sparkles size={11} className="text-brand-gold" />
              <span className="text-xs font-bold text-brand-gold">+{meta.xp} XP</span>
            </div>
          )}

          {/* Botão compartilhar */}
          <button
            type="button"
            onClick={handleShare}
            disabled={shareState === 'sharing'}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
            style={{
              background: `linear-gradient(135deg, ${style.color}, #FF4D00)`,
              color: meta.rarity === 'legendary' ? '#1a1400' : '#fff',
            }}
          >
            {shareState === 'copied' ? (
              <>
                <Check size={16} /> Copiado!
              </>
            ) : shareState === 'sharing' ? (
              <>
                <Share2 size={16} /> Compartilhando...
              </>
            ) : (
              <>
                <Share2 size={16} /> Compartilhar conquista
              </>
            )}
          </button>

          <button
            type="button"
            onClick={close}
            className="mt-3 w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-[#8899BB] transition-colors hover:text-white"
          >
            Continuar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes achievementPop {
          0% { transform: scale(0.3) rotate(-12deg); opacity: 0; }
          60% { transform: scale(1.12) rotate(4deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
