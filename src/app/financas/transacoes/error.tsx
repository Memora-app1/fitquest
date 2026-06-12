'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, ArrowLeftRight, AlertCircle, ShieldCheck } from 'lucide-react';

export default function TransacoesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[TransacoesError]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl p-8"
        style={{
          background:
            'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(13,24,41,0.99) 60%, rgba(0,255,136,0.04) 100%)',
          border: '1px solid rgba(59,130,246,0.22)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full blur-2xl"
          style={{ background: 'rgba(59,130,246,0.16)' }}
        />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.28)',
              }}
            >
              <ArrowLeftRight size={26} style={{ color: '#3B82F6' }} />
            </div>
            <div>
              <div
                className="mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-widest"
                style={{
                  background: 'rgba(59,130,246,0.12)',
                  color: '#3B82F6',
                  border: '1px solid rgba(59,130,246,0.2)',
                }}
              >
                Finanças › Transações
              </div>
              <h1 className="text-xl font-black">Erro ao carregar transações</h1>
            </div>
          </div>

          <div
            className="flex items-start gap-3 rounded-xl p-4"
            style={{
              background: 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.14)',
            }}
          >
            <AlertCircle size={16} style={{ color: '#3B82F6' }} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-text-secondary">
                Não foi possível carregar seu histórico de transações. Nenhuma transação foi perdida
                ou alterada — o problema é apenas na exibição.
              </p>
              {error.digest && (
                <p className="mt-2 select-all font-mono text-xs text-text-muted">
                  Código: {error.digest}
                </p>
              )}
            </div>
          </div>

          <div
            className="flex items-center gap-3 rounded-xl p-3"
            style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.1)' }}
          >
            <ShieldCheck size={14} style={{ color: '#00FF88' }} className="shrink-0" />
            <p className="text-xs text-text-secondary">
              Todas as transações estão seguras no banco de dados. Nenhum dado financeiro foi
              perdido.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(59,130,246,0.25)',
              }}
            >
              <RefreshCw size={14} />
              Recarregar
            </button>
            <Link
              href="/financas"
              className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:opacity-80"
              style={{
                background: 'rgba(59,130,246,0.1)',
                color: '#3B82F6',
                border: '1px solid rgba(59,130,246,0.2)',
              }}
            >
              Resumo Finanças
            </Link>
            <Link
              href="/financas/contas"
              className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:opacity-80"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--color-text-secondary)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              Ver contas
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-text-muted transition-all hover:bg-white/5 hover:text-white"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <Home size={13} />
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
