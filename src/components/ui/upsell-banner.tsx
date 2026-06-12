import Link from 'next/link';
import { Zap, Crown, ArrowRight } from 'lucide-react';

interface UpsellBannerProps {
  variant?: 'trial' | 'expired' | 'default';
  trialEnd?: string | null;
  feature?: string;
  compact?: boolean;
}

export function UpsellBanner({
  variant = 'default',
  trialEnd,
  feature,
  compact = false,
}: UpsellBannerProps) {
  const trialEndDate = trialEnd ? new Date(trialEnd).toLocaleDateString('pt-BR') : null;

  const content =
    variant === 'expired'
      ? {
          emoji: '🔴',
          title: 'Sua assinatura expirou',
          subtitle: 'Renove para voltar a usar todos os recursos.',
          cta: 'Renovar agora',
          accentRgb: '239,68,68',
          accentColor: '#EF4444',
        }
      : variant === 'trial' && trialEndDate
        ? {
            emoji: '⏳',
            title: `Trial termina em ${trialEndDate}`,
            subtitle: feature
              ? `Assine para continuar usando ${feature} sem interrupção.`
              : 'Assine agora e garanta 31% de desconto no plano anual.',
            cta: 'Ver planos →',
            accentRgb: '245,200,66',
            accentColor: '#F5C842',
          }
        : {
            emoji: '⚡',
            title: feature
              ? `${feature} é exclusivo para assinantes`
              : 'Desbloqueie o pleno potencial',
            subtitle: 'Acesso completo por menos de R$ 1,25/dia. 7 dias grátis.',
            cta: 'Começar grátis →',
            accentRgb: '255,77,0',
            accentColor: '#FF4D00',
          };

  if (compact) {
    return (
      <div
        className="flex items-center justify-between gap-3 rounded-xl p-3"
        style={{
          background: `rgba(${content.accentRgb},0.08)`,
          border: `1px solid rgba(${content.accentRgb},0.25)`,
        }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-base">{content.emoji}</span>
          <span className="truncate text-xs text-text-secondary">{content.subtitle}</span>
        </div>
        <Link
          href="/planos"
          className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all hover:opacity-90"
          style={{ background: `rgba(${content.accentRgb},0.15)`, color: content.accentColor }}
        >
          {content.cta}
          <ArrowRight size={11} />
        </Link>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background: `linear-gradient(135deg, rgba(${content.accentRgb},0.10) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.05) 100%)`,
        border: `1px solid rgba(${content.accentRgb},0.3)`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
        style={{ background: `rgba(${content.accentRgb},0.12)` }}
      />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl"
            style={{
              background: `rgba(${content.accentRgb},0.12)`,
              border: `1px solid rgba(${content.accentRgb},0.3)`,
            }}
          >
            {content.emoji}
          </div>
          <div>
            <h3 className="text-sm font-black leading-tight text-white">{content.title}</h3>
            <p className="mt-0.5 text-xs text-text-secondary">{content.subtitle}</p>
          </div>
        </div>

        <Link
          href="/planos"
          className="flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:scale-[1.02] hover:opacity-90"
          style={{
            background: `rgba(${content.accentRgb},0.15)`,
            border: `1px solid rgba(${content.accentRgb},0.35)`,
            color: content.accentColor,
          }}
        >
          <Crown size={14} />
          {content.cta}
        </Link>
      </div>

      {variant !== 'expired' && (
        <div className="relative z-10 mt-4 flex flex-wrap gap-4 text-[11px] text-text-muted">
          <span className="flex items-center gap-1.5">
            <Zap size={10} style={{ color: '#F5C842' }} fill="currentColor" />7 dias grátis no Anual
          </span>
          <span>• Cancele quando quiser</span>
          <span>• Pix · Cartão · Boleto</span>
          <span>• Garantia de 7 dias</span>
        </div>
      )}
    </div>
  );
}
