import type { Metadata, Viewport } from 'next'
import { DM_Sans, Bebas_Neue } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
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
    default: 'Ascendia — Sua vida inteira em um só sistema',
    template: '%s | Ascendia',
  },
  description:
    'Life OS gamificado: fitness, produtividade, finanças e coach IA. Cada ação vira XP. Cada dia vira evolução.',
  keywords: ['fitness', 'hábitos', 'produtividade', 'finanças', 'gamificação', 'XP', 'life os', 'streak'],
  authors: [{ name: 'Ascendia' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://ascendia-app1.vercel.app'),
  openGraph: {
    title: 'Ascendia — Sua vida inteira em um só sistema',
    description: 'Cada ação vira XP. Cada dia vira evolução.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Ascendia',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ascendia — Life OS gamificado',
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
    apple: '/favicon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Ascendia',
  },
}

export const viewport: Viewport = {
  themeColor: '#050914',
  width: 'device-width',
  initialScale: 1,
  // Permite zoom de acessibilidade (userScalable: false quebra WCAG)
  // iOS respeita isso via CSS touch-action em vez do meta tag
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${bebas.variable}`}>
      <body className="min-h-screen">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
