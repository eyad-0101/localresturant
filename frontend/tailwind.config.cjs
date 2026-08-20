/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdedd3',
          200: '#fad5a5',
          300: '#f6b66e',
          400: '#f18d33',
          500: '#ef710a',
          600: '#de5904',
          700: '#b84306',
          800: '#92350c',
          900: '#762d0c',
        },
        secondary: {
          50: '#f6f9ec',
          100: '#ebf3d1',
          200: '#d9e8a7',
          300: '#c2d874',
          400: '#a5c241',
          500: '#89a81e',
          600: '#6a8712',
          700: '#526814',
          800: '#425316',
          900: '#384615',
        },
      },
    },
  },
  plugins: [],
};
