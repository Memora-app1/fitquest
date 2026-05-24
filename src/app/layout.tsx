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
  title: {
    default: 'FitQuest — Sua vida inteira em um só sistema',
    template: '%s | FitQuest',
  },
  description:
    'Life OS gamificado: fitness, produtividade, finanças e coach IA. Cada ação vira XP. Cada dia vira evolução.',
  keywords: ['fitness', 'hábitos', 'produtividade', 'finanças', 'gamificação', 'XP', 'life os', 'streak'],
  authors: [{ name: 'FitQuest' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://fitquest-app1.vercel.app'),
  openGraph: {
    title: 'FitQuest — Sua vida inteira em um só sistema',
    description: 'Cada ação vira XP. Cada dia vira evolução.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'FitQuest',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FitQuest — Life OS gamificado',
    description: 'Fitness, produtividade, finanças e coach IA. Tudo gamificado.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
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
