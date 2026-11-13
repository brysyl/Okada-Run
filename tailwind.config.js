/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { arcade: ['"Press Start 2P"', 'ui-monospace', 'monospace'] },
      colors: { naija: '#008751', okada: '#ffb703' },
    },
  },
  plugins: [],
};
