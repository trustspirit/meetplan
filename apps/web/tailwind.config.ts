import type { Config } from "tailwindcss";

/** hsl(var(--x)) 래퍼 — `<alpha-value>` 덕에 `bg-primary/10` 같은 알파 수식어가 동작한다. */
const token = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: {
          DEFAULT: token("surface"),
          subtle: token("surface-subtle"),
        },
        border: {
          DEFAULT: token("border"),
          strong: token("border-strong"),
        },
        text: {
          DEFAULT: token("text"),
          muted: token("text-muted"),
          subtle: token("text-subtle"),
        },
        primary: {
          DEFAULT: token("primary"),
          hover: token("primary-hover"),
          subtle: token("primary-subtle"),
          foreground: token("primary-foreground"),
        },
        success: token("success"),
        warning: token("warning"),
        danger: token("danger"),
        "on-status": token("on-status"),
        brand: {
          50: token("brand-50"),
          100: token("brand-100"),
          200: token("brand-200"),
          300: token("brand-300"),
          400: token("brand-400"),
          500: token("brand-500"),
          600: token("brand-600"),
          700: token("brand-700"),
          800: token("brand-800"),
          900: token("brand-900"),
        },
      },
      ringColor: {
        DEFAULT: token("ring"),
        ring: token("ring"),
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],   // 11 / 16
        xs: ["0.75rem", { lineHeight: "1rem" }],        // 12 / 16
        sm: ["0.875rem", { lineHeight: "1.25rem" }],    // 14 / 20
        base: ["1rem", { lineHeight: "1.5rem" }],       // 16 / 24
        lg: ["1.125rem", { lineHeight: "1.625rem" }],   // 18 / 26
        xl: ["1.25rem", { lineHeight: "1.75rem" }],     // 20 / 28
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(16 24 40 / 0.04)",
        sm: "0 1px 3px 0 rgb(16 24 40 / 0.08), 0 1px 2px -1px rgb(16 24 40 / 0.06)",
        md: "0 4px 12px -2px rgb(16 24 40 / 0.10), 0 2px 6px -2px rgb(16 24 40 / 0.06)",
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
    },
  },
  plugins: [],
} satisfies Config;
