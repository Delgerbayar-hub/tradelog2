/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#09090b',
        bg2:     '#0f1014',
        bg3:     '#141519',
        card:    '#111215',
        border:  '#1c1d22',
        border2: '#242529',
        muted:   '#52525b',
        accent:  '#00e5ff',
        green:   '#22c55e',
        red:     '#ef4444',
        yellow:  '#eab308',
        purple:  '#a855f7',
      },
      fontFamily: {
        sans:    ['"Inter"', 'sans-serif'],
        display: ['"Cal Sans"', '"Inter"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}