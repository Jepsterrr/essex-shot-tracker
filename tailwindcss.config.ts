import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'essex-red': '#b91c1c',
        'essex-gold': '#d4af37',
        'card-white': '#fdfdfd',
        'felt-green-dark': '#0f172a',
      },
      fontFamily: {
        serif: ['"EB Garamond"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};

export default config;