import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FitQuest — Life OS Gamificado',
    short_name: 'FitQuest',
    description: 'Fitness, produtividade, finanças e coach IA. Tudo gamificado.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#050914',
    theme_color: '#FF4D00',
    orientation: 'portrait',
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
    categories: ['health', 'fitness', 'productivity', 'finance'],
    lang: 'pt-BR',
  }
}
