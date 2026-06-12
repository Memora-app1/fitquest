'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCcw, ArrowLeft } from 'lucide-react';

export default function GuildDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GuildDetailError]', error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div
        className="w-full max-w-md space-y-6 rounded-2xl p-10 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.99) 100%)',
          border: '1px solid rgba(124,58,237,0.25)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div className="text-5xl">⚔️</div>
        <div className="space-y-2">
          <h1 className="text-xl font-black">Guild não encontrada</h1>
          <p className="text-sm text-text-secondary">
            Essa guild pode ter sido dissolvida ou o link está inválido.
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
          <Link href="/guilds" className="btn-ghost flex flex-1 items-center justify-center gap-2">
            <ArrowLeft size={15} /> Ver guilds
          </Link>
        </div>
      </div>
    </main>
  );
}
