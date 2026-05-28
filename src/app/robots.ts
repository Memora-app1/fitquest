import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ascendia-app1.vercel.app'
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/planos', '/termos', '/privacidade'],
        disallow: ['/dashboard', '/habitos', '/tarefas', '/treinos', '/financas', '/coach', '/score', '/perfil', '/onboarding', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
