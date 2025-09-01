import { type Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ascension: {
          bg: "#1e1b4b",
          accent: "#fbbf24"
        }
      }
    }
  },
  plugins: []
} satisfies Config;