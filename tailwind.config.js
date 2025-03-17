/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sharon-dark': '#121212',
        'sharon-orange': '#ff6b00',
        'sharon-paper': '#1e1e1e',
      },
    },
  },
  plugins: [],
}

