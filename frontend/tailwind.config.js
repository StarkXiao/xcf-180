/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        carbon: {
          900: '#0d0d1a',
          800: '#1a1a2e',
          700: '#16213e',
          600: '#1f2937',
          500: '#374151',
        },
        moto: {
          orange: '#ff6b35',
          'orange-light': '#ff8c5a',
          'orange-dark': '#e55a2b',
          silver: '#e2e2e2',
          steel: '#8d99ae',
        },
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        body: ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
