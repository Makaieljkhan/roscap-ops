import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#f5f0e8',
        'cream-2': '#eee8db',
        card: '#ffffff',
        border: '#ddd6c8',
        green: '#0d2b1f',
        'green-mid': '#1a4030',
        'green-light': '#2d6a4f',
        'green-muted': '#4a7060',
        gold: '#c9a84c',
        'gold-soft': '#e2c47a',
        t1: '#0d2b1f',
        t2: '#3d5a4a',
        t3: '#7a9080',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
