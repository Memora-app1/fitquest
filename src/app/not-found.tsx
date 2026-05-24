import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Página não encontrada',
  robots: { index: false },
}

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card-glow w-full max-w-md p-10 text-center space-y-6 animate-slide-up">
        <div className="heading-display text-8xl gradient-text">404</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Página não encontrada</h1>
          <p className="text-text-secondary">
            Essa página foi embora treinar e não voltou ainda.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/dashboard" className="btn-primary px-6 py-3">
            Ir para o Dashboard →
          </Link>
          <Link href="/" className="btn-ghost px-6 py-3">
            Página inicial
          </Link>
        </div>
      </div>
    </main>
  )
}
