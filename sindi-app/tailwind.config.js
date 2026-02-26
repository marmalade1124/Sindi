/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "primary": "#FFD600",
        "primary-foreground": "#1a1a1a",
        "secondary": "#0F1F3D",
        "background-light": "#F5F5F7",
        "surface-light": "#ffffff",
        "surface-white": "#FFFFFF",
        "surface-card": "#ffffff",
        "text-main": "#1e293b",
        "text-muted": "#64748b",
        "text-sub": "#4A5568",
        "nav-active": "#1e3a8a",
        "nav-inactive": "#94a3b8",
        "navy-dark": "#0F172A",
        "navy-muted": "#334155",
      }
    },
  },
  plugins: [],
}

