/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#FAEEDA',
          100: '#FAC775',
          400: '#EF9F27',
          500: '#BA7517',
          700: '#854F0B',
        },
      },
    },
  },
  plugins: [],
}
