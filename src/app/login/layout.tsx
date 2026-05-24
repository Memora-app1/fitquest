import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Entre na sua conta FitQuest e continue sua evolução.',
  robots: { index: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
