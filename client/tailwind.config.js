/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        'dark-1':'#121416',
        'dark-2':'#16191D',
        'dark-3':'#22262B',
        'dark-4':'#2D3136',
        'dark-5':'#595B5F',
      }
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide')
  ],
}

