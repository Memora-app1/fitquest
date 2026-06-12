import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { NovoTreinoForm } from '@/components/treinos/novo-treino-form';

export const metadata: Metadata = {
  title: 'Novo Treino',
  description: 'Registre sua sessão de treino e ganhe XP no Ascendia.',
};

export default function NovoTreinoPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-text-secondary">Carregando...</div>}>
        <NovoTreinoForm />
      </Suspense>
    </AppShell>
  );
}
