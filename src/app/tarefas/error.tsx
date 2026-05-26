'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, Home, CheckSquare, AlertCircle, ChevronRight } from 'lucide-react'

export default function TarefasError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[TarefasError]', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div
        className="w-full max-w-lg p-8 rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.09) 0%, rgba(13,24,41,0.99) 60%, rgba(239,68,68,0.04) 100%)',
          border: '1px solid rgba(124,58,237,0.25)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(124,58,237,0.05)',
        }}
      >
        {/* Ambient glows */}
        <div
          className="absolute -top-6 -right-6 w-32 h-32 rounded-full pointer-events-none blur-2xl"
          style={{ background: 'rgba(124,58,237,0.18)' }}
        />
        <div
          className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full pointer-events-none blur-xl"
          style={{ background: 'rgba(239,68,68,0.08)' }}
        />

        <div className="relative z-10 space-y-6">
          {/* Icon row */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(124,58,237,0.14)',
                border: '1px solid rgba(124,58,237,0.3)',
              }}
            >
              <CheckSquare size={28} className="text-brand-purple" />
            </div>
            <div>
              <div
                className="text-xs font-bold uppercase tracking-widest mb-1 px-2 py-0.5 rounded-full inline-block"
                style={{ background: 'rgba(124,58,237,0.14)', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.25)' }}
              >
                Seção: Tarefas
              </div>
              <h1 className="text-xl font-black">Erro ao carregar tarefas</h1>
            </div>
          </div>

          {/* Description */}
          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.15)' }}
          >
            <AlertCircle size={16} className="text-brand-purple mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-text-secondary">
                Não foi possível carregar seu Kanban ou suas tarefas. Nenhuma tarefa foi perdida —
                tente recarregar a seção.
              </p>
              {error.digest && (
                <p className="text-xs text-text-muted font-mono mt-2 select-all">
                  Código: {error.digest}
                </p>
              )}
            </div>
          </div>

          {/* Quick recovery tips */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Alternativas:</p>
            {[
              'Recarregar o Kanban de tarefas',
              'Acessar a Matriz Eisenhower diretamente',
              'Verificar sua conexão e tentar novamente',
            ].map((tip, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                <ChevronRight size={12} className="text-brand-purple shrink-0" />
                {tip}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #5B21B6, #7C3AED)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
              }}
            >
              <RefreshCw size={14} />
              Recarregar
            </button>
            <Link
              href="/tarefas/eisenhower"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
              style={{
                background: 'rgba(124,58,237,0.1)',
                color: '#9F5AF7',
                border: '1px solid rgba(124,58,237,0.2)',
              }}
            >
              Eisenhower
            </Link>
            <Link
              href="/dashboard"
              className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm text-text-secondary transition-all hover:text-white hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
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
