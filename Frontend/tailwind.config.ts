import type { Config } from 'tailwindcss';

/**
 * Design tokens EXAUCE — teintes extraites du logo (pipette PIL) :
 * turquoise signature #4EB9AE, turquoise profond #129FA4,
 * noir encre #0C0F11, trait turquoise pâle #A1DAD4.
 * Toute couleur utilisée dans les composants doit venir d'ici (aucune couleur en dur).
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
          500: '#4EB9AE', // teinte exacte du logo
          600: '#129FA4', // turquoise profond du logo
          700: '#1A8080',
          800: '#1C6666',
          900: '#1B5353',
          pale: '#A1DAD4', // trait pâle (petits traits du logo)
        },
        // Noir encre (titres, sections sombres, footer)
        ink: {
          DEFAULT: '#0C0F11',
          850: '#101417',
          800: '#14191C',
          700: '#1C2225',
          600: '#2A3135',
        },
        // Vert-bleu profond (fonds sombres premium, dégradés)
        abyss: {
          DEFAULT: '#0F2F33',
          light: '#163F44',
        },
        // Blanc cassé / ivoire
        ivory: '#F7F9F8',
        // Gris neutres froids
        slate: {
          400: '#8A9599',
          500: '#6B767B',
          600: '#4E585C',
        },
        // Accent champagne — micro-détails uniquement
        champagne: {
          DEFAULT: '#C9A96A',
          700: '#8F7542',
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
      },
      borderRadius: {
        card: '1.25rem',
      },
      boxShadow: {
        card: '0 6px 24px -8px rgba(12, 15, 17, 0.10)',
        cardHover: '0 16px 40px -12px rgba(18, 159, 164, 0.22)',
        glow: '0 0 0 1px rgba(78, 185, 174, 0.35), 0 8px 32px -8px rgba(18, 159, 164, 0.35)',
      },
      backgroundImage: {
        'abyss-gradient': 'linear-gradient(160deg, #0C0F11 0%, #0F2F33 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
