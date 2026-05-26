'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, Home, LayoutGrid, AlertCircle, ChevronRight } from 'lucide-react'

export default function EisenhowerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[EisenhowerError]', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div
        className="w-full max-w-lg p-8 rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.07) 0%, rgba(13,24,41,0.99) 60%, rgba(124,58,237,0.05) 100%)',
          border: '1px solid rgba(239,68,68,0.22)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="absolute -top-6 -right-6 w-32 h-32 rounded-full pointer-events-none blur-2xl"
          style={{ background: 'rgba(239,68,68,0.14)' }}
        />
        <div
          className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full pointer-events-none blur-xl"
          style={{ background: 'rgba(124,58,237,0.08)' }}
        />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <LayoutGrid size={26} style={{ color: '#EF4444' }} />
            </div>
            <div>
              <div
                className="text-xs font-bold uppercase tracking-widest mb-1 px-2 py-0.5 rounded-full inline-block"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                Tarefas › Eisenhower
              </div>
              <h1 className="text-xl font-black">Erro na Matriz Eisenhower</h1>
            </div>
          </div>

          {/* Quadrant visual hint */}
          <div className="grid grid-cols-2 gap-1.5 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            {[
              { label: 'Fazer Agora', color: '#EF4444' },
              { label: 'Agendar', color: '#F5C842' },
              { label: 'Delegar', color: '#F97316' },
              { label: 'Eliminar', color: '#8899BB' },
            ].map(({ label, color }) => (
              <div
                key={label}
                className="rounded-lg p-2 text-center"
                style={{ background: `${color}09`, border: `1px solid ${color}18` }}
              >
                <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
              </div>
            ))}
          </div>

          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.14)' }}
          >
            <AlertCircle size={16} style={{ color: '#EF4444' }} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-text-secondary">
                Não foi possível carregar a Matriz Eisenhower. Suas tarefas e suas classificações
                de urgência/importância estão seguras.
              </p>
              {error.digest && (
                <p className="text-xs text-text-muted font-mono mt-2 select-all">
                  Código: {error.digest}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Alternativas:</p>
            {[
              'Recarregar a Matriz Eisenhower',
              'Usar o Kanban de tarefas no lugar',
              'Criar nova tarefa e voltar depois',
            ].map((tip, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                <ChevronRight size={12} style={{ color: '#EF4444' }} className="shrink-0" />
                {tip}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #B91C1C, #EF4444)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(239,68,68,0.25)',
              }}
            >
              <RefreshCw size={14} />
              Recarregar
            </button>
            <Link
              href="/tarefas"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
              style={{ background: 'rgba(124,58,237,0.1)', color: '#9F5AF7', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              Kanban
            </Link>
            <Link
              href="/dashboard"
              className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm text-text-muted transition-all hover:text-white hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <Home size={13} />
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
