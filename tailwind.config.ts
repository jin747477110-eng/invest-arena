import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        gold: { 400: "#f0c060", 500: "#d4a840", 600: "#b89030" },
        surface: { 800: "#1a1d24", 900: "#111318", 950: "#0a0c10" },
      },
    },
  },
  plugins: [],
};
export default config;
