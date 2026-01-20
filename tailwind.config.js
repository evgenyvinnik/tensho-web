/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette from ARCHITECTURE.MD
        'forest-green': '#2D5F4A',
        'vibrant-orange': '#FF5722',
        'golden-yellow': '#FFD54F',
        'deep-orange': '#D84315',
        'dark-forest': '#1C3A2E',
        'beige-white': '#F5F5DC',
        'saddle-brown': '#8B4513',
        'metallic-gold': '#C8B273',
        // Rarity colors
        'rarity-common': '#9E9E9E',
        'rarity-uncommon': '#4CAF50',
        'rarity-rare': '#2196F3',
        'rarity-epic': '#9C27B0',
        'rarity-legendary': '#FFD54F',
        'rarity-mythic': '#FF5722',
        // Suit colors
        'suit-manzu': '#D32F2F',
        'suit-pinzu': '#1976D2',
        'suit-souzu': '#388E3C',
        'suit-wind': '#5D4037',
        'suit-dragon': '#6A1B9A',
        'suit-flower': '#E91E63',
        'suit-season': '#00796B',
      },
      fontFamily: {
        'tile': ['LongCang', 'serif'],
        'ui': ['Noto Sans JP', 'Hiragino Sans', 'Meiryo', 'sans-serif'],
        'decorative': ['Go3v2', 'cursive'],
      },
      boxShadow: {
        'tile': '2px 2px 4px rgba(0, 0, 0, 0.3)',
        'button': '0 4px 8px rgba(0, 0, 0, 0.2)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
}
