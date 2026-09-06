/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./grooming.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0a1b24",
        paper: "#f4f7f9",
        brand: {
          50: "#f0f7fc",
          100: "#dcedf8",
          200: "#bee0f3",
          300: "#8ecced",
          400: "#55b2e3",
          500: "#2b96d3",
          600: "#1c7ab6",
          700: "#146193",
          800: "#0f4e77",
          900: "#013755",
          950: "#002135"
        },
        pine: {
          50: "#f0f7fc",
          100: "#dcedf8",
          200: "#bee0f3",
          300: "#8ecced",
          400: "#55b2e3",
          500: "#2b96d3",
          600: "#1c7ab6",
          700: "#146193",
          800: "#0f4e77",
          900: "#013755",
          950: "#002135"
        },
        clay: {
          500: "#d9783a",
          600: "#c45f22"
        }
      },
      boxShadow: {
        card: "0 10px 30px -12px rgba(1, 55, 85, 0.18)",
        lift: "0 18px 40px -16px rgba(1, 55, 85, 0.28)"
      }
    }
  },
  plugins: []
};
