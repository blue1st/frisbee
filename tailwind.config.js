/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dog: {
          bg: "#12141d",
          card: "#1b1e2e",
          cardBorder: "#2a2f45",
          primary: "#fbbf24", // Frisbee Gold
          primaryHover: "#f59e0b",
          accent: "#ec4899", // Playful Pink
          cyan: "#06b6d4",
          success: "#10b981",
          danger: "#ef4444",
        }
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
