import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Novo Treino',
  description: 'Registre um novo treino, adicione exercícios e ganhe XP.',
}

export default function NovoTreinoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
