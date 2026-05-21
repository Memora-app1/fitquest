import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-bebas)', 'sans-serif'],
      },
      colors: {
        bg: {
          DEFAULT: '#050914',
          card: '#0D1829',
          elevated: '#152238',
        },
        border: {
          DEFAULT: '#1F2D45',
          subtle: '#152238',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#8899BB',
          muted: '#5A6B85',
        },
        brand: {
          orange: '#FF4D00',
          purple: '#7C3AED',
          green: '#00FF88',
          gold: '#F5C842',
          red: '#FF4444',
          blue: '#3B82F6',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #FF4D00 0%, #7C3AED 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(255,77,0,0.08))',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'xp-bump': 'xpBump 0.6s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 77, 0, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 77, 0, 0.6)' },
        },
        xpBump: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
