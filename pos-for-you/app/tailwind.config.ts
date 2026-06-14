import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ocean theme (dark navy)
        ocean: {
          sidebar: "#080d1a",
          bg: "#0d1b2e",
          card: "#132038",
          border: "#1e3a5f",
          text: "#e2e8f0",
          muted: "#64748b",
          accent: "#3b82f6",
          active: "#1e3a5f",
        },
        // Warm theme (cream/orange)
        warm: {
          sidebar: "#1a0a00",
          bg: "#fef9f0",
          card: "#ffffff",
          border: "#fde8c8",
          text: "#1c0a00",
          muted: "#92400e",
          accent: "#f97316",
          active: "#fff0d6",
        },
        // Brand
        brand: {
          red: "#dc2626",
          orange: "#f97316",
          green: "#16a34a",
          blue: "#2563eb",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Noto Sans Lao", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
