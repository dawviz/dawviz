/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 50: '#f4f5f8', 100: '#e6e8ef', 300: '#a3a9bd', 500: '#5b627a', 700: '#2a2f42', 800: '#1b1f2e', 900: '#131622', 950: '#0c0e16' },
        accent: { 400: '#7cc4ff', 500: '#4aa8f5', 600: '#2b8be0' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
