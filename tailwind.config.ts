import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Greenshades brand green — adjust to the official palette.
        brand: {
          DEFAULT: "#00843D",
          dark: "#006B31",
          light: "#E6F3EC",
        },
      },
    },
  },
  plugins: [],
};

export default config;
