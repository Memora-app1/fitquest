import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ascendia — Life OS Gamificado',
    short_name: 'Ascendia',
    description: 'Fitness, produtividade, finanças e coach IA. Tudo gamificado.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#050914',
    theme_color: '#FF4D00',
    orientation: 'portrait',
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    categories: ['health', 'fitness', 'productivity', 'finance'],
    lang: 'pt-BR',
  }
}
