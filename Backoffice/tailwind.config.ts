import type { Config } from 'tailwindcss';

/**
 * Tokens EXAUCE repris à l'identique du Frontend (teintes du logo),
 * complétés par des alias sémantiques propres au back-office.
 * Toute couleur d'un composant doit venir d'ici : aucune valeur en dur.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Turquoise signature (dégradé 50 → 900)
        turquoise: {
          50: '#F0FAF9',
          100: '#D9F2F0',
          200: '#B2E3E0',
          300: '#7DD0CB',
          400: '#5CC5BF',
          500: '#4EB9AE',
          600: '#129FA4',
          700: '#1A8080',
          800: '#1C6666',
          900: '#1B5353',
          pale: '#A1DAD4',
        },
        // Noir encre (sidebar, titres)
        ink: {
          DEFAULT: '#0C0F11',
          850: '#101417',
          800: '#14191C',
          700: '#1C2225',
          600: '#2A3135',
        },
        // Vert-bleu profond (dégradés, états actifs)
        abyss: {
          DEFAULT: '#0F2F33',
          light: '#163F44',
        },
        ivory: '#F7F9F8',
        slate: {
          400: '#8A9599',
          500: '#6B767B',
          600: '#4E585C',
        },
        champagne: {
          DEFAULT: '#C9A96A',
          700: '#8F7542',
        },
        // ── Alias sémantiques back-office ──
        canvas: '#F2F6F5',
        surface: '#FFFFFF',
        line: '#E2E9E7',
        muted: '#6B767B',
        status: {
          success: '#1A8080',
          'success-soft': '#D9F2F0',
          warning: '#8F7542',
          'warning-soft': '#F6EEDC',
          danger: '#B4423A',
          'danger-soft': '#FBE9E7',
          info: '#129FA4',
          'info-soft': '#D9F2F0',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(2.5rem, 6vw, 4.5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2rem, 4.5vw, 3.25rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(1.5rem, 3vw, 2.25rem)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
      spacing: {
        section: '6rem',
        'section-sm': '3.5rem',
        sidebar: '17rem',
        'sidebar-collapsed': '5.25rem',
        navbar: '4.5rem',
      },
      borderRadius: {
        card: '1.25rem',
        panel: '0.875rem',
        control: '0.625rem',
      },
      boxShadow: {
        card: '0 6px 24px -8px rgba(12, 15, 17, 0.10)',
        cardHover: '0 16px 40px -12px rgba(18, 159, 164, 0.22)',
        glow: '0 0 0 1px rgba(78, 185, 174, 0.35), 0 8px 32px -8px rgba(18, 159, 164, 0.35)',
        pop: '0 18px 48px -20px rgba(12, 15, 17, 0.30)',
      },
      backgroundImage: {
        'abyss-gradient': 'linear-gradient(160deg, #0C0F11 0%, #0F2F33 100%)',
        'sidebar-gradient': 'linear-gradient(175deg, #0C0F11 0%, #101417 55%, #0F2F33 100%)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-up': 'slide-up 180ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
