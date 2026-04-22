/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Mono'", "monospace"],
        body: ["'DM Sans'", "sans-serif"],
      },
      colors: {
        ink:    { DEFAULT: "#0d0f14", 50: "#1a1d26", 100: "#22263300" },
        paper:  { DEFAULT: "#f5f0e8", dim: "#e8e3da" },
        emerald:{ DEFAULT: "#00c896", dim: "#009e76" },
        crimson:{ DEFAULT: "#f03e3e", dim: "#c42f2f" },
        gold:   { DEFAULT: "#f5c518", dim: "#c49c10" },
        slate2: { DEFAULT: "#8892a4" },
      },
    },
  },
  plugins: [],
}
