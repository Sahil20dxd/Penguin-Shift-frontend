/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#7C3AED', // purple accent for PenguinShift
      },
    },
  },
  plugins: [

    require('tailwindcss-animate'),
  ],
}
