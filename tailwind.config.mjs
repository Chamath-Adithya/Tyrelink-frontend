/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
      },
      colors: {
        brand: {
          50: '#fff5f5',
          100: '#ffe1e2',
          200: '#ffc8c9',
          300: '#ffa0a3',
          400: '#f7656a',
          500: '#ed1c24', // Tyrelink Official Racing Red
          600: '#c9141b', // Hover
          700: '#a50f16', // Pressed
          800: '#830f14',
          900: '#681115',
          DEFAULT: '#ed1c24',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          850: '#141E33',
          900: '#0F172A',
          950: '#090D16',
        },
        whatsapp: {
          light: '#DCFCE7',
          DEFAULT: '#25D366',
          dark: '#16A34A',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
        sinhala: ['"Noto Sans Sinhala"', 'system-ui', 'sans-serif'],
        sinhalaDisplay: ['"Gemunu Libre"', '"Noto Sans Sinhala"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
        card: '0 10px 30px -5px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 20px 40px -10px rgba(15, 23, 42, 0.10)',
        glow: '0 0 25px rgba(237, 28, 36, 0.28)',
        'glow-sm': '0 0 15px rgba(237, 28, 36, 0.20)',
        'glow-green': '0 0 20px rgba(37, 211, 102, 0.30)',
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(ellipse at top, rgba(237, 28, 36, 0.08), transparent 70%)',
        'radial-slate': 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.03), transparent 70%)',
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
        'marquee-slow': 'marquee 40s linear infinite',
        'pulse-subtle': 'pulseSubtle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'floatSlow 4s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fadeIn 0.4s ease both',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.85 },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(237,28,36,0)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(237,28,36,0.25)' },
        },
      },
    },
  },
  plugins: [],
};
