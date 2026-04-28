import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Sora"', '"Space Grotesk"', 'sans-serif'],
        display: ['"Space Grotesk"', '"Sora"', 'sans-serif'],
      },
      colors: {
        night: {
          950: '#070711',
          900: '#0b0d1d',
          800: '#13172f',
        },
      },
      boxShadow: {
        glow: '0 0 28px rgba(64, 208, 255, 0.24)',
        neon: '0 0 40px rgba(219, 75, 255, 0.28)',
        glass: '0 14px 40px rgba(6, 8, 18, 0.45)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.75' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        pulseSoft: 'pulseSoft 2.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config

