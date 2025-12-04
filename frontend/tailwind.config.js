/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        stone: {
          850: '#1c1917',
          950: '#0c0a09',
        },
        amber: {
          450: '#f59e0b',
          950: '#451a03',
        }
      }
    },
  },
  plugins: [],
}