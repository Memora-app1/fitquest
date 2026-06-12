import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Remove o header "X-Powered-By: Next.js" — evita fingerprinting da stack
  poweredByHeader: false,

  // web-push usa módulos nativos do Node.js (crypto, http2).
  // Marcá-lo como externo impede o bundler de tentar processá-lo para o browser.
  serverExternalPackages: ['web-push'],

  experimental: {
    // Habilita a View Transitions API nativa do browser entre rotas.
    // Permite CSS ::view-transition-* e <ViewTransition name=""> para shared element animations.
    viewTransition: true,
  },

  images: {
    // Prioriza formatos modernos: AVIF (~50% menor que JPEG) → WebP → JPEG fallback
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google avatars
    ],
    // Tamanhos de device para gerar srcset correto — alinhado com breakpoints mobile-first
    deviceSizes: [375, 430, 768, 1024, 1280, 1440],
    imageSizes: [48, 96, 128, 256],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // CSP — defesa contra XSS. unsafe-inline necessário para Tailwind CSS-in-JS e Recharts inline styles.
          // unsafe-eval necessário para Next.js turbopack em dev (produção remove automaticamente).
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://vercel.live",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
