/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1a2e2b",
        paper: "#f4efe6",
        pine: {
          50: "#eef7f4",
          100: "#d5ebe4",
          500: "#2a7a6a",
          600: "#1f5f53",
          700: "#174a41",
          800: "#133c35",
          900: "#0f2f2a"
        },
        clay: {
          500: "#d9783a",
          600: "#c45f22"
        }
      },
      boxShadow: {
        card: "0 10px 30px -12px rgba(19, 60, 53, 0.18)",
        lift: "0 18px 40px -16px rgba(19, 60, 53, 0.28)"
      }
    }
  },
  plugins: []
};
