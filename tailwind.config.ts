import type { Config } from "tailwindcss";

/**
 * Slate greys carry the interface; each colour has one job so it always means
 * something:
 *   brand (indigo)   — every action: buttons, links, active navigation
 *   money (teal)     — fees, success, "applications open", accepted work
 *   accent (orange)  — attention: unread counts, updates, highlights
 *   rose             — danger only (delete, reject, errors)
 *   amber            — waiting (under review)
 */
const indigo = {
  50: "#eef2ff",
  100: "#e0e7ff",
  200: "#c7d2fe",
  300: "#a5b4fc",
  400: "#818cf8",
  500: "#6366f1",
  600: "#4f46e5",
  700: "#4338ca",
  800: "#3730a3",
  900: "#312e81",
  950: "#1e1b4b",
};

/** Money and success. Aliased over `emerald` so existing success styles follow. */
const teal = {
  50: "#f0fdfa",
  100: "#ccfbf1",
  200: "#99f6e4",
  300: "#5eead4",
  400: "#2dd4bf",
  500: "#14b8a6",
  600: "#0d9488",
  700: "#0f766e",
  800: "#115e59",
  900: "#134e4a",
  950: "#042f2e",
};

/** Warm highlight for attention — deliberately not rose, which means danger. */
const orange = {
  50: "#fff7ed",
  100: "#ffedd5",
  200: "#fed7aa",
  300: "#fdba74",
  400: "#fb923c",
  500: "#f97316",
  600: "#ea580c",
  700: "#c2410c",
  800: "#9a3412",
  900: "#7c2d12",
  950: "#431407",
};

/** Slate: cool, crisp greys for surfaces, borders and text. */
const grey = {
  50: "#f8fafc",
  100: "#f1f5f9",
  200: "#e2e8f0",
  300: "#cbd5e1",
  400: "#94a3b8",
  500: "#64748b",
  600: "#475569",
  700: "#334155",
  800: "#1e293b",
  900: "#0f172a",
  950: "#020617",
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
        brand: indigo,
        accent: orange,
        money: teal,
        ink: grey,

        // Transitional aliases. The app already contains ~82 `indigo-*` and
        // ~411 `slate-*` usages; re-pointing the built-in names re-themes every
        // one of them from here instead of touching 80 files. New code should
        // use brand/ink. Remove these once the migration finishes.
        indigo,
        emerald: teal,
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
