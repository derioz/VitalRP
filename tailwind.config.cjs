/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand palette pulled from logo vibe (amber -> orange -> ember) on deep dark base
        vital: {
          bg: "#070707",
          panel: "#0f0f12",
          panel2: "#141418",
          line: "rgba(255,255,255,0.08)",
          text: "#f4f4f5",
          muted: "#b0b0b8",
          amber: "#ffb300",
          orange: "#ff7a00",
          ember: "#ff4d00"
        }
      },
      boxShadow: {
        glow: "0 10px 40px rgba(0,0,0,0.55)",
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    },
  },
  plugins: [],
};
