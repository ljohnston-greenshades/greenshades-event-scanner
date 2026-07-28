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
      keyframes: {
        // A scan line sweeping down the badge, fading in/out at the edges.
        scanline: {
          "0%": { top: "0%", opacity: "0" },
          "12%": { opacity: "1" },
          "88%": { opacity: "1" },
          "100%": { top: "100%", opacity: "0" },
        },
        // Subtle breathing tint over the badge while processing.
        scanpulse: {
          "0%, 100%": { opacity: "0.25" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        scanline: "scanline 1.5s ease-in-out infinite",
        scanpulse: "scanpulse 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
