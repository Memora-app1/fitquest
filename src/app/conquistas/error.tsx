'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, Trophy } from 'lucide-react';

export default function ConquistasError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ConquistasError]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div
        className="relative w-full max-w-md space-y-6 overflow-hidden rounded-2xl p-8 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(245,200,66,0.06) 0%, rgba(13,24,41,0.99) 100%)',
          border: '1px solid rgba(245,200,66,0.2)',
        }}
      >
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.2)' }}
        >
          <Trophy size={28} style={{ color: '#F5C842' }} />
        </div>
        <div>
          <h1 className="mb-2 text-xl font-black">Erro ao carregar Conquistas</h1>
          <p className="text-sm text-text-secondary">
            Não conseguimos carregar suas conquistas. Seus troféus estão seguros.
          </p>
          {error.digest && (
            <p className="mt-2 font-mono text-xs text-text-muted">ID: {error.digest}</p>
          )}
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold"
            style={{
              background: 'rgba(245,200,66,0.15)',
              border: '1px solid rgba(245,200,66,0.3)',
              color: '#F5C842',
            }}
          >
            <RefreshCw size={14} /> Recarregar
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:text-white"
          >
            <Home size={14} /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
