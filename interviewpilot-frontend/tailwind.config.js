/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0A0B0F",       // deepest background
        surface: {
          DEFAULT: "#13151C",  // glass card base
          raised: "#1A1D27",   // hover/raised state
          border: "#262A38",   // hairline borders on glass
        },
        signal: {
          violet: "#7C5CFC",
          "violet-dim": "#5B42B8",
          cyan: "#4FD8EA",
          "cyan-dim": "#2FA3B3",
        },
        ink: {
          DEFAULT: "#EDEFF7",  // primary text
          muted: "#8A8FA3",    // secondary text
          faint: "#565B6E",    // tertiary / placeholder
        },
        status: {
          applied: "#8A8FA3",
          screening: "#4FD8EA",
          technical: "#7C5CFC",
          hr: "#F5A623",
          offer: "#34D399",
          rejected: "#F76A6A",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "signal-gradient": "linear-gradient(135deg, #7C5CFC 0%, #4FD8EA 100%)",
        "signal-gradient-soft": "linear-gradient(135deg, rgba(124,92,252,0.15) 0%, rgba(79,216,234,0.15) 100%)",
        "void-radial": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,92,252,0.25), transparent)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        "glow-violet": "0 0 24px rgba(124,92,252,0.35)",
        "glow-cyan": "0 0 24px rgba(79,216,234,0.35)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "pulse-bar": {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "pulse-bar": "pulse-bar 1s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};
