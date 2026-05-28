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
        'slide-right': 'slideRight 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'xp-bump': 'xpBump 0.6s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        'streak-fire': 'streakFire 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow-green': 'glowGreen 2s ease-in-out infinite',
        'glow-orange': 'glowOrange 2s ease-in-out infinite',
        'glow-cyan': 'glowCyan 2s ease-in-out infinite',
        'glow-gold': 'glowGold 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'level-up': 'levelUp 0.8s cubic-bezier(0.34,1.56,0.64,1)',
        'progress-fill': 'progressFill 1.2s ease-out',
        'counter': 'counter 0.5s ease-out',
        'wiggle': 'wiggle 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
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
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '70%': { transform: 'scale(1.08)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        streakFire: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1) saturate(1)' },
          '50%': { opacity: '0.85', filter: 'brightness(1.3) saturate(1.4)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowGreen: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(0,255,136,0.2)' },
          '50%': { boxShadow: '0 0 28px rgba(0,255,136,0.5)' },
        },
        glowOrange: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(255,77,0,0.2)' },
          '50%': { boxShadow: '0 0 28px rgba(255,77,0,0.5)' },
        },
        glowCyan: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(0,217,255,0.2)' },
          '50%': { boxShadow: '0 0 28px rgba(0,217,255,0.5)' },
        },
        glowGold: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(245,200,66,0.2)' },
          '50%': { boxShadow: '0 0 28px rgba(245,200,66,0.5)' },
        },
        levelUp: {
          '0%': { opacity: '0', transform: 'scale(0.5) translateY(20px)' },
          '60%': { transform: 'scale(1.15) translateY(-4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        progressFill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-width, 100%)' },
        },
        counter: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-8deg)' },
          '75%': { transform: 'rotate(8deg)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
