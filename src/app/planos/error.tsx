'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, ArrowLeft, CreditCard, AlertCircle, ChevronRight, ShieldCheck, Zap, Lock } from 'lucide-react'

export default function PlanosError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[PlanosError]', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div
        className="w-full max-w-lg p-8 rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.99) 60%, rgba(255,77,0,0.04) 100%)',
          border: '1px solid rgba(124,58,237,0.25)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Corner glows */}
        <div
          className="absolute -top-6 -right-6 w-36 h-36 rounded-full pointer-events-none blur-2xl"
          style={{ background: 'rgba(124,58,237,0.18)' }}
        />
        <div
          className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full pointer-events-none blur-xl"
          style={{ background: 'rgba(255,77,0,0.1)' }}
        />

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.28)' }}
            >
              <CreditCard size={26} style={{ color: '#7C3AED' }} />
            </div>
            <div>
              <div
                className="text-xs font-bold uppercase tracking-widest mb-1 px-2 py-0.5 rounded-full inline-block"
                style={{ background: 'rgba(124,58,237,0.12)', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.22)' }}
              >
                Planos & Assinaturas
              </div>
              <h1 className="text-xl font-black">Erro ao carregar os planos</h1>
            </div>
          </div>

          {/* Error message */}
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.14)' }}
          >
            <AlertCircle size={16} style={{ color: '#7C3AED' }} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-text-secondary">
                Não foi possível carregar as informações de planos no momento. Seu acesso atual
                não foi afetado — tente novamente em alguns instantes.
              </p>
              {error.digest && (
                <p className="text-xs text-text-muted font-mono mt-2 select-all">
                  Código: {error.digest}
                </p>
              )}
            </div>
          </div>

          {/* Reassurance strip */}
          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.12)' }}
          >
            <ShieldCheck size={14} className="shrink-0" style={{ color: '#00FF88' }} />
            <p className="text-xs text-text-secondary">
              Sua assinatura e dados estão seguros. Nenhuma cobrança indevida foi realizada.
            </p>
          </div>

          {/* Possible reasons */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Possíveis causas:</p>
            {[
              'Instabilidade temporária no serviço de pagamentos',
              'Conexão lenta ou ausente com a internet',
              'O servidor de planos está sendo atualizado',
            ].map((tip, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                <ChevronRight size={12} style={{ color: '#7C3AED' }} className="shrink-0" />
                {tip}
              </div>
            ))}
          </div>

          {/* Feature highlight — keep user interested */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(255,77,0,0.04) 100%)',
              border: '1px solid rgba(124,58,237,0.15)',
            }}
          >
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">O que você desbloqueia com o Pro:</p>
            <div className="grid grid-cols-1 gap-2">
              {[
                { icon: Zap, text: 'Coach IA ilimitado em todos os módulos', color: '#F5C842' },
                { icon: Lock, text: 'Histórico completo de treinos e finanças', color: '#7C3AED' },
                { icon: ShieldCheck, text: 'Metas avançadas + relatórios detalhados', color: '#00FF88' },
              ].map(({ icon: Icon, text, color }, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `rgba(${color === '#F5C842' ? '245,200,66' : color === '#7C3AED' ? '124,58,237' : '0,255,136'},0.12)` }}
                  >
                    <Icon size={12} style={{ color }} />
                  </div>
                  <p className="text-xs text-text-secondary">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #5B21B6, #7C3AED)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
              }}
            >
              <RefreshCw size={15} />
              Tentar novamente
            </button>
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-text-secondary transition-all hover:text-white hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ArrowLeft size={14} />
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
