/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff4ed",
          100: "#ffe6d5",
          200: "#ffc9aa",
          300: "#ffa374",
          400: "#ff6f3c",
          500: "#fb4a1d",
          600: "#ec3010",
          700: "#c4210f",
          800: "#9c1c14",
          900: "#7e1a14",
        },
      },
    },
  },
  plugins: [],
};
