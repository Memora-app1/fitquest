import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/app-shell'
import { NovoTreinoForm } from '@/components/treinos/novo-treino-form'

export const metadata: Metadata = {
  title: 'Novo Treino',
  description: 'Registre sua sessão de treino e ganhe XP no FitQuest.',
}

export default function NovoTreinoPage() {
  return (
    <AppShell>
      <NovoTreinoForm />
    </AppShell>
  )
}
