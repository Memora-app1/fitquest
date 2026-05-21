import type { Metadata, Viewport } from 'next'
import { DM_Sans, Bebas_Neue } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FitQuest — Sua vida inteira em um só sistema',
  description:
    'Life OS gamificado: fitness, produtividade, finanças e coach IA. Cada ação vira XP. Cada dia vira evolução.',
  keywords: ['fitness', 'hábitos', 'produtividade', 'finanças', 'gamificação', 'XP'],
  authors: [{ name: 'FitQuest' }],
  openGraph: {
    title: 'FitQuest — Sua vida inteira em um só sistema',
    description: 'Cada ação vira XP. Cada dia vira evolução.',
    type: 'website',
    locale: 'pt_BR',
  },
}

export const viewport: Viewport = {
  themeColor: '#050914',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${bebas.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
