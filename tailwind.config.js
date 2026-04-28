/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brown: {
          DEFAULT: '#3d1f0a',
          2: '#6b3a1f',
          3: '#a0522d',
        },
        cream: {
          DEFAULT: '#fdf6ee',
          2: '#f5ebe0',
          3: '#e8d5c0',
        },
        warm: '#fffbf6',
      },
      fontFamily: {
        lao: ['Noto Sans Lao', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}
