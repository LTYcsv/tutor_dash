/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        indigo: {
          DEFAULT: '#4F46E5',
          dark: '#4338CA',
          light: '#EEF2FF'
        }
      }
    }
  },
  plugins: []
};
