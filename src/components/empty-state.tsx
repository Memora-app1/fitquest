/**
 * EmptyState — estado vazio premium com emoji, CTA e social proof.
 * Substitui mensagens genéricas tipo "Nenhum item encontrado".
 */

import Link from 'next/link';

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  socialProof?: string;
  tip?: string;
}

export function EmptyState({
  emoji,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
  socialProof,
  tip,
}: EmptyStateProps) {
  return (
    <div
      className="animate-fade-in rounded-2xl p-8 text-center md:p-10"
      style={{
        background: 'linear-gradient(135deg, rgba(13,24,41,0.98) 0%, rgba(21,34,56,0.6) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Emoji com glow */}
      <div
        className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl text-4xl"
        style={{
          background: 'rgba(255,77,0,0.08)',
          border: '1px solid rgba(255,77,0,0.15)',
          boxShadow: '0 0 30px rgba(255,77,0,0.08)',
        }}
      >
        {emoji}
      </div>

      <h3 className="mb-2 text-xl font-black">{title}</h3>
      <p className="mx-auto mb-6 max-w-xs text-sm leading-relaxed text-text-secondary">
        {description}
      </p>

      {/* CTA */}
      {ctaHref ? (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #FF4D00, #7C3AED)',
            boxShadow: '0 4px 20px rgba(255,77,0,0.25)',
          }}
        >
          {ctaLabel}
        </Link>
      ) : (
        <button
          onClick={onCtaClick}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #FF4D00, #7C3AED)',
            boxShadow: '0 4px 20px rgba(255,77,0,0.25)',
          }}
        >
          {ctaLabel}
        </button>
      )}

      {/* Dica de XP */}
      {tip && (
        <div
          className="mt-5 inline-flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.15)' }}
        >
          <span className="text-xs" style={{ color: '#F5C842' }}>
            ⚡ {tip}
          </span>
        </div>
      )}

      {/* Social proof */}
      {socialProof && <p className="mt-4 text-[11px] text-text-muted">{socialProof}</p>}
    </div>
  );
}
