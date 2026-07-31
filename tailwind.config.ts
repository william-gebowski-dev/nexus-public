import type { Config } from "tailwindcss";

/**
 * Paleta estendida a partir de legacy/css/style.css.
 * Cores semânticas:
 *  - accent (teal): técnico / .dev / primário
 *  - geb (violeta): pessoal / .geb
 *  - amber: atenção / em aberto
 *  - green: confirmado / OK
 *  - red (sólido): falhas críticas
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-elevated": "var(--bg-elevated)",
        surface: "var(--surface)",
        "surface-hover": "var(--surface-hover)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        text: "var(--text)",
        "text-dim": "var(--text-dim)",
        "text-faint": "var(--text-faint)",
        primary: "var(--primary)",
        "primary-soft": "var(--primary-soft)",
        secondary: "var(--secondary)",
        "secondary-soft": "var(--secondary-soft)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        link: "var(--link)",
        inverse: "var(--inverse)",
        geb: "var(--geb)",
        "geb-soft": "var(--geb-soft)",
        amber: "var(--amber)",
        "amber-soft": "var(--amber-soft)",
        green: "var(--green)",
        "green-soft": "var(--green-soft)",
        red: "var(--red)",
        "red-soft": "var(--red-soft)",
      },
      fontFamily: {
        mono: ["var(--font-mono)"],
        sans: ["var(--font-sans)"],
      },
      borderColor: {
        DEFAULT: "var(--border)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      animation: {
        "shimmer": "shimmer 1.6s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
