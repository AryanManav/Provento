import type { Config } from "tailwindcss";

/**
 * A single electric blue carries the whole interface. Everything else is
 * greyscale, so colour always means something: brand blue for action, emerald
 * for money, rose for danger. Gold appears only in illustration, never chrome.
 */
const blue = {
  50: "#eff6ff",
  100: "#dbeafe",
  200: "#bfdbfe",
  300: "#93c5fd",
  400: "#60a5fa",
  500: "#3b82f6",
  600: "#2570f0",
  700: "#1d5bc9",
  800: "#1c47a3",
  900: "#1a3d82",
  950: "#132752",
};

const gold = {
  50: "#fff9eb",
  100: "#fff0c7",
  200: "#ffe08a",
  300: "#ffcb4d",
  400: "#fdb724",
  500: "#f0a00b",
  600: "#d07c06",
  700: "#a65709",
  800: "#88440e",
  900: "#73380f",
  950: "#431b03",
};

/** Near-neutral greys: the quiet backdrop a single saturated accent needs. */
const grey = {
  50: "#fafafa",
  100: "#f4f4f5",
  200: "#e9e9ec",
  300: "#d4d4d8",
  400: "#a1a1aa",
  500: "#71717a",
  600: "#52525b",
  700: "#3f3f46",
  800: "#27272a",
  900: "#18181b",
  950: "#09090b",
};

/**
 * Type and space both step by φ (1.618). Type uses √φ (1.272) for the half
 * steps, because a pure φ ramp jumps too far for dense UI text — `sm` is the
 * one pragmatic exception, kept at 14px for table and helper text.
 *
 * Spacing uses Fibonacci, which *is* φ expressed in integers.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        hand: ["var(--font-hand)", "ui-serif", "cursive"],
      },
      colors: {
        // Semantic tokens — prefer these in new code.
        brand: blue,
        accent: gold,
        ink: grey,

        // Transitional aliases. The app already contains ~82 `indigo-*` and
        // ~411 `slate-*` usages; re-pointing the built-in names re-themes every
        // one of them from here instead of touching 80 files. New code should
        // use brand/ink. Remove these once the migration finishes.
        indigo: blue,
        slate: grey,

        surface: "var(--surface)",
        "surface-muted": "var(--surface-muted)",
        line: "var(--line)",
      },
      fontSize: {
        xs: ["0.786rem", { lineHeight: "1.125rem" }], // 16 / φ^0.5
        sm: ["0.875rem", { lineHeight: "1.3125rem" }], // pragmatic 14px
        base: ["1rem", { lineHeight: "1.618rem" }], // φ leading
        lg: ["1.272rem", { lineHeight: "1.75rem" }], // 16 × √φ
        xl: ["1.618rem", { lineHeight: "2rem" }], // 16 × φ
        "2xl": ["2.058rem", { lineHeight: "2.4rem" }],
        "3xl": ["2.618rem", { lineHeight: "3rem" }], // 16 × φ²
        "4xl": ["3.33rem", { lineHeight: "3.6rem" }],
        "5xl": ["4.236rem", { lineHeight: "4.5rem" }], // 16 × φ³
        "6xl": ["5.389rem", { lineHeight: "5.6rem" }], // 16 × φ^3.5
      },
      spacing: {
        // Fibonacci — φ in integers.
        fib1: "0.125rem", // 2
        fib2: "0.1875rem", // 3
        fib3: "0.3125rem", // 5
        fib4: "0.5rem", // 8
        fib5: "0.8125rem", // 13
        fib6: "1.3125rem", // 21
        fib7: "2.125rem", // 34
        fib8: "3.4375rem", // 55
        fib9: "5.5625rem", // 89
      },
      borderRadius: {
        lg: "0.625rem",
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(15 14 13 / 0.04)",
        sm: "0 1px 3px 0 rgb(15 14 13 / 0.06), 0 1px 2px -1px rgb(15 14 13 / 0.04)",
        md: "0 4px 12px -2px rgb(15 14 13 / 0.08), 0 2px 4px -2px rgb(15 14 13 / 0.04)",
        lg: "0 12px 32px -8px rgb(37 14 92 / 0.12), 0 4px 8px -4px rgb(15 14 13 / 0.05)",
        glow: "0 0 0 1px rgb(107 46 240 / 0.12), 0 8px 24px -6px rgb(107 46 240 / 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
