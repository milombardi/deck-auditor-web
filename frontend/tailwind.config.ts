import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mockup palette
        bg: "#0b0f1a",
        surface: "#141a2a",
        surfaceAlt: "#1a2030",
        border: "rgba(255,255,255,0.06)",
        borderStrong: "rgba(255,255,255,0.12)",
        ink: {
          high: "#ffffff",
          mid: "#cbd5e1",
          low: "#94a3b8",
          muted: "#64748b",
        },
        band: {
          ready: "#16a34a",
          close: "#3b82f6",
          needsWork: "#f59e0b",
          rebuild: "#ef4444",
        },
        accent: {
          blue: "#3b82f6",
          purple: "#a855f7",
        },
      },
      backgroundImage: {
        "primary-gradient": "linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)",
      },
      boxShadow: {
        glow: "0 0 28px rgba(99, 102, 241, 0.45)",
        glowStrong: "0 0 40px rgba(99, 102, 241, 0.6)",
        card: "0 8px 32px rgba(0, 0, 0, 0.35)",
      },
      borderRadius: {
        xl2: "20px",
        xl3: "24px",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      animation: {
        "spin-slow": "spin 8s linear infinite",
        "fade-in": "fadeIn 0.4s ease-out",
        "scale-in": "scaleIn 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
