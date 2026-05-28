import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ascendia — Life OS Gamificado',
    short_name: 'Ascendia',
    description: 'Fitness, produtividade, finanças e coach IA em um só app. Tudo gamificado com XP.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#050914',
    theme_color: '#050914',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Registrar Hábito',
        short_name: 'Hábitos',
        description: 'Vá para seus hábitos do dia',
        url: '/habitos',
        icons: [{ src: '/favicon.svg', sizes: 'any' }],
      },
      {
        name: 'Novo Treino',
        short_name: 'Treino',
        description: 'Iniciar um novo treino',
        url: '/treinos/novo',
        icons: [{ src: '/favicon.svg', sizes: 'any' }],
      },
      {
        name: 'Coach IA',
        short_name: 'Coach',
        description: 'Falar com o Coach IA',
        url: '/coach',
        icons: [{ src: '/favicon.svg', sizes: 'any' }],
      },
    ],
    categories: ['health', 'fitness', 'productivity', 'finance', 'lifestyle'],
    lang: 'pt-BR',
    dir: 'ltr',
    prefer_related_applications: false,
  }
}
