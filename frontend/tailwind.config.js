/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          50: '#F0F8F8',
          100: '#DFF1F1',
          200: '#C2E7E7',
          300: '#9CD8D8',
          400: '#6EC5C5',
          500: '#45ADAD',
          600: '#2E7D7D',
          700: '#226060',
          800: '#174646',
          900: '#0E2C2C',
        },
      },
    },
  },
  plugins: [],
}