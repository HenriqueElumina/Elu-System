import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          charcoal: "#20232a",
          cream: "#e6ddcc",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
