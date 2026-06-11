import Link from 'next/link'
import { Zap, Crown, ArrowRight } from 'lucide-react'

interface UpsellBannerProps {
  variant?: 'trial' | 'expired' | 'default'
  trialEnd?: string | null
  feature?: string
  compact?: boolean
}

export function UpsellBanner({ variant = 'default', trialEnd, feature, compact = false }: UpsellBannerProps) {
  const trialEndDate = trialEnd ? new Date(trialEnd).toLocaleDateString('pt-BR') : null

  const content = variant === 'expired'
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
        title: feature ? `${feature} é exclusivo para assinantes` : 'Desbloqueie o pleno potencial',
        subtitle: 'Acesso completo por menos de R$ 1,25/dia. 7 dias grátis.',
        cta: 'Começar grátis →',
        accentRgb: '255,77,0',
        accentColor: '#FF4D00',
      }

  if (compact) {
    return (
      <div
        className="rounded-xl p-3 flex items-center justify-between gap-3"
        style={{
          background: `rgba(${content.accentRgb},0.08)`,
          border: `1px solid rgba(${content.accentRgb},0.25)`,
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">{content.emoji}</span>
          <span className="text-xs text-text-secondary truncate">{content.subtitle}</span>
        </div>
        <Link
          href="/planos"
          className="shrink-0 flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all hover:opacity-90"
          style={{ background: `rgba(${content.accentRgb},0.15)`, color: content.accentColor }}
        >
          {content.cta}
          <ArrowRight size={11} />
        </Link>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgba(${content.accentRgb},0.10) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.05) 100%)`,
        border: `1px solid rgba(${content.accentRgb},0.3)`,
      }}
    >
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
        style={{ background: `rgba(${content.accentRgb},0.12)` }}
      />

      <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl"
            style={{
              background: `rgba(${content.accentRgb},0.12)`,
              border: `1px solid rgba(${content.accentRgb},0.3)`,
            }}
          >
            {content.emoji}
          </div>
          <div>
            <h3 className="font-black text-white text-sm leading-tight">
              {content.title}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">{content.subtitle}</p>
          </div>
        </div>

        <Link
          href="/planos"
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] hover:opacity-90"
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
            <Zap size={10} style={{ color: '#F5C842' }} fill="currentColor" />
            7 dias grátis no Anual
          </span>
          <span>• Cancele quando quiser</span>
          <span>• Pix · Cartão · Boleto</span>
          <span>• Garantia de 7 dias</span>
        </div>
      )}
    </div>
  )
}
