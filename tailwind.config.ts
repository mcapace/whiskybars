import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Whisky Advocate Brand Colors
        'wa-red': '#e04720',
        'wa-red-dark': '#c73d1a',
        'wa-cream': '#fdf9f1',
        'wa-brown': '#9e380d',
        'wa-gold': '#f9bd13',
        'wa-amber': '#d4a84b',
        // Legacy aliases
        'whisky-red': '#e04720',
        'whisky-red-dark': '#c73d1a',
        'whisky-cream': '#fdf9f1',
        'whisky-brown': '#9e380d',
        'whisky-gold': '#f9bd13',
        apex: {
          paper: '#e8e5de',
          night: '#05070d',
          ink: '#0a0f1a',
          mist: '#5c6578',
          frost: '#a8c4e8',
          cyan: '#2ec4b6',
          violet: '#7c6cf0',
        },
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Georgia', 'Cambria', 'serif'],
        sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'hero': ['4rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'hero-sm': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
