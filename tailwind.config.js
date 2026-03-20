/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#09090b',
        bg2:     '#0f1014',
        bg3:     '#141519',
        border:  '#1c1d22',
        border2: '#242529',
        // text hierarchy
        primary:   '#f4f4f5',
        secondary: '#a1a1aa',
        muted:     '#52525b',
        // interactive surface
        'hover-bg': '#1a1b20',
        accent:  '#00e5ff',
        green:   '#22c55e',
        red:     '#ef4444',
        yellow:  '#eab308',
        purple:  '#a855f7',
        // accessible text variants
        profit:  '#4ade80',
        loss:    '#f87171',
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