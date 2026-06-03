/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // FinPulse Design System
        surface: {
          900: '#0a0b0f',
          800: '#10121a',
          700: '#161924',
          600: '#1c2030',
          500: '#222840',
        },
        accent: {
          DEFAULT: '#00d4aa',
          dim:     '#00b892',
          glow:    '#00d4aa33',
        },
        gold: {
          DEFAULT: '#f0b429',
          dim:     '#d4930f',
        },
        bull:  '#00c48c',
        bear:  '#ff4b6e',
        neut:  '#7b86a8',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 .5H31.5V32' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/svg%3E\")",
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in':     'slideIn 0.3s ease-out',
        'fade-up':      'fadeUp 0.4s ease-out',
        'shimmer':      'shimmer 1.5s infinite',
      },
      keyframes: {
        slideIn: {
          '0%':   { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',      opacity: '1' },
        },
        fadeUp: {
          '0%':   { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0'  },
        },
      },
    },
  },
  plugins: [],
}
