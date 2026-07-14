import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F1E8",
        pine: "#1F3B2C",
        "pine-soft": "#345943",
        summit: "#0F1F17",
        blaze: "#D9622B",
        ember: "#E8834A",
        creek: "#3E7C8C",
        granite: "#6B6558",
        contour: "#C9C2AC",
        danger: "#B8402F",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        badge: "2px",
      },
      keyframes: {
        stamp: {
          "0%": { transform: "scale(1.3) rotate(-4deg)", opacity: "0" },
          "60%": { transform: "scale(0.96) rotate(-4deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-4deg)", opacity: "1" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        contourDrift: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "200px 200px" },
        },
      },
      animation: {
        stamp: "stamp 0.35s ease-out",
        "pulse-dot": "pulseDot 1.6s ease-in-out infinite",
        contour: "contourDrift 60s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
