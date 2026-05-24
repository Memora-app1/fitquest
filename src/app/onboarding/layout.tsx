import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Boas-vindas',
  description: 'Configure seu perfil e comece sua jornada no FitQuest.',
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
