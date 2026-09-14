import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        canvas: "#f4f2ee",
        brand: {
          50: "#ebf4fd",
          100: "#cce4f9",
          200: "#99c9f4",
          300: "#66aeee",
          400: "#3393e9",
          500: "#0a66c2", // LinkedIn signature blue
          600: "#08529c",
          700: "#063e76",
          800: "#04294f",
          900: "#021529",
          950: "#010b15",
        },
      },
    },
  },
  plugins: [],
};
export default config;
