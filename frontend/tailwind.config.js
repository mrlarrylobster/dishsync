/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dish-bg': '#FFFBF7',
        'dish-card': '#FFFFFF',
        'dish-coral': '#FF6B4A',
        'dish-mint': '#4ECDC4',
        'dish-gold': '#FFD93D',
        'dish-text': '#2D2D2D',
        'dish-muted': '#8C8C8C',
        'dish-success': '#6BCB77',
        'dish-warning': '#FFB347',
      },
    },
  },
  plugins: [],
}
