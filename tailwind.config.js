/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FFD700', // Taxi Yellow
        secondary: '#000000', // Z-Black
        accent: '#FF4500', // Orange-Red
        success: '#008000',
        danger: '#D32F2F',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        bangers: ['Bangers', 'cursive'],
      },
      boxShadow: {
        'neo': '4px 4px 0px 0px rgba(0,0,0,1)',
      },
    },
  },
  plugins: [],
}
