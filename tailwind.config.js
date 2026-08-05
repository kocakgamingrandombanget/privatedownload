/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        app: {
          bg: '#F5F6F9',
          surface: '#FFFFFF',
          textMain: '#1C1D22',
          textSub: '#8E8E93',
          border: '#F2F2F7',
          purpleTab: '#D8B4FE', purpleBody: '#C084FC',
          orangeTab: '#FCD34D', orangeBody: '#FBBF24',
          blueTab: '#93C5FD',   blueBody: '#60A5FA',
          pinkTab: '#FBCFE8',   pinkBody: '#F472B6',
        }
      },
      boxShadow: {
        'app': '0 8px 24px rgba(149, 157, 165, 0.08)',
        'folder-purple': '0 10px 25px -5px rgba(192, 132, 252, 0.4)',
        'folder-orange': '0 10px 25px -5px rgba(251, 191, 36, 0.4)',
        'folder-blue': '0 10px 25px -5px rgba(96, 165, 250, 0.4)',
        'folder-pink': '0 10px 25px -5px rgba(244, 114, 182, 0.4)',
      }
    }
  },
  plugins: [],
}
