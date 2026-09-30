/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: '#F0E922',
          dark: '#1D1C33',
          blue: '#0629F5',
          muted: '#DAD9E7',
          light: '#F0F1FF'
        }
      },
      boxShadow: {
        panel: '0 18px 45px rgba(29, 28, 51, 0.18)'
      },
      fontFamily: {
        silkscreen: ['Silkscreen', 'monospace'],
        changa: ['Changa One', 'sans-serif'],
        exo: ['Exo', 'sans-serif']
      }
    }
  },
  plugins: []
};
