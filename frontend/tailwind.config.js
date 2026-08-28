/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#03281E',
          900: '#043E2E',
          850: '#064E3B',
          800: '#065F46',
          700: '#047857',
          600: '#059669',
          500: '#10B981',
          100: '#D1FAE5',
          50: '#ECFDF5',
        },
        slate: {
          950: '#0B0F17',
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          700: '#B45309',
          800: '#92400E',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'elevated': '0 10px 25px -5px rgba(4, 62, 46, 0.08), 0 8px 10px -6px rgba(4, 62, 46, 0.04)',
        'hero': '0 14px 30px -10px rgba(4, 62, 46, 0.28)',
      }
    },
  },
  plugins: [],
}
