/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'pgs-red': '#E53E3E',
        'pgs-blue': '#3B82F6',
        'pgs-white': '#FFFFFF',
        'pgs-bg-light': '#F7FAFC',
        'pgs-bg-dark': '#1A202C',
        'pgs-text-light': '#1A202C',
        'pgs-text-dark': '#EDF2F7',
        'pgs-border-light': '#E2E8F0',
        'pgs-border-dark': '#4A5568',
        // Module specific colors
        'academie-blue': '#3B82F6',
        'studio-red': '#E53E3E',
        'decor-yellow': '#FBBF24',
        'shop-green': '#10B981',
        'achats-purple': '#8B5CF6',
        'finances-blue': '#0EA5E9',
        'personnel-indigo': '#6366F1',
        'clients-teal': '#14B8A6',
        'wifizone-orange': '#F97316',
        'securite-gray': '#64748B',
        'admin-gray': '#475569',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
