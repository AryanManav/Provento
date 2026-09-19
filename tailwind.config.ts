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
 * Type: a conventional product scale (12 → 60px) with tight leading on
 * headings. Dense UI text lives at `sm` (14px); `base` is reading text.
 *
 * Space: a 4px grid. The `fibN` names are historical — they now resolve to the
 * nearest grid step, so every screen that used them sits on the same grid.
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
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
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
        "2xs": ["0.6875rem", { lineHeight: "1rem" }], // 11 — overline, dense meta
        xs: ["0.75rem", { lineHeight: "1rem" }], // 12 — caption, label
        sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14 — UI body
        base: ["1rem", { lineHeight: "1.5rem" }], // 16 — reading body
        lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18 — body large, H4
        xl: ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }], // 20 — H3
        "2xl": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.015em" }], // 24 — H2
        "3xl": ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "-0.02em" }], // 30 — H1
        "4xl": ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-0.025em" }], // 36
        "5xl": ["3rem", { lineHeight: "3.25rem", letterSpacing: "-0.03em" }], // 48 — display
        "6xl": ["3.75rem", { lineHeight: "4rem", letterSpacing: "-0.035em" }], // 60
      },
      spacing: {
        fib1: "0.125rem", // 2
        fib2: "0.25rem", // 4
        fib3: "0.375rem", // 6
        fib4: "0.5rem", // 8
        fib5: "0.75rem", // 12
        fib6: "1.25rem", // 20
        fib7: "2rem", // 32
        fib8: "3rem", // 48
        fib9: "5rem", // 80
      },
      borderRadius: {
        sm: "0.25rem", // 4
        DEFAULT: "0.375rem", // 6
        md: "0.375rem", // 6
        lg: "0.5rem", // 8 — controls
        xl: "0.75rem", // 12 — cards
        "2xl": "0.75rem", // 12 — cards (legacy name)
        "3xl": "1rem", // 16 — large surfaces
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(15 23 42 / 0.04)",
        sm: "0 1px 2px 0 rgb(15 23 42 / 0.05), 0 1px 3px 0 rgb(15 23 42 / 0.04)",
        md: "0 4px 8px -2px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.04)",
        lg: "0 12px 24px -8px rgb(15 23 42 / 0.10), 0 4px 8px -4px rgb(15 23 42 / 0.04)",
        glow: "0 0 0 1px rgb(79 70 229 / 0.10), 0 8px 24px -8px rgb(79 70 229 / 0.20)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(2px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
