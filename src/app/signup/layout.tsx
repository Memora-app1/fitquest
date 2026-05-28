import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Criar conta',
  description: '7 dias grátis. Crie sua conta no Ascendia e comece a gamificar sua vida hoje.',
  robots: { index: false },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
