import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/contracts/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cocoa: "#1f2937",
        rosewood: "#6b7280",
        coral: "#f43f5e",
        brand: {
          primary: "#6366f1", // Indigo
          secondary: "#a855f7", // Purple
          accent: "#f43f5e", // Rose/Coral
          light: "#e0e7ff",
          dark: "#1e1b4b",
        },
        surface: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          glass: "rgba(255, 255, 255, 0.7)",
        }
      },
      boxShadow: {
        liquid: "0 20px 50px rgba(99, 102, 241, 0.15)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Pretendard JP",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "Helvetica Neue",
          "Segoe UI",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "Malgun Gothic",
          "sans-serif",
        ],
        serif: [
          "var(--font-sans)",
          "Pretendard JP",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "Helvetica Neue",
          "Segoe UI",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "Malgun Gothic",
          "Iowan Old Style",
          "Palatino Linotype",
          "Georgia",
          "serif",
        ],
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        }
      },
      animation: {
        rise: "rise 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
        float: "float 3s ease-in-out infinite",
        blob: "blob 7s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
