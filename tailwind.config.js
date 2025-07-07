/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'roblox-blue': '#00A2FF',
        'roblox-green': '#00D4AA',
        'roblox-orange': '#FF6B35',
        'dark-bg': '#1E1E1E',
        'darker-bg': '#252526',
        'panel-bg': '#2D2D30',
        'border-color': '#3E3E42'
      },
      fontFamily: {
        'mono': ['Consolas', 'Monaco', 'Courier New', 'monospace']
      }
    },
  },
  plugins: [],
} 