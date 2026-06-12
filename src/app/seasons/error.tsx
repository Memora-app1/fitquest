'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCcw, Layers } from 'lucide-react';

export default function SeasonsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[SeasonsError]', error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div
        className="w-full max-w-md space-y-6 rounded-2xl p-10 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(0,255,136,0.06) 0%, rgba(13,24,41,0.99) 100%)',
          border: '1px solid rgba(0,255,136,0.2)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}
        >
          <Layers size={28} style={{ color: '#00FF88' }} />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-black">Erro ao carregar Temporada</h1>
          <p className="text-sm text-text-secondary">
            Não foi possível carregar a temporada ativa. Tente novamente.
          </p>
          {error.digest && <p className="font-mono text-xs text-text-muted">ID: {error.digest}</p>}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="btn-primary flex flex-1 items-center justify-center gap-2"
          >
            <RefreshCcw size={15} /> Tentar novamente
          </button>
          <Link
            href="/dashboard"
            className="btn-ghost flex flex-1 items-center justify-center gap-2"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
