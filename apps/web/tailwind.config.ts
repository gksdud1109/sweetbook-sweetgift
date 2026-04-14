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
        blush: "#f3d9d2",
        rosewood: "#6f4e4e",
        cocoa: "#3b2f2f",
        cream: "#f8f3ea",
        oat: "#efe2cf",
        coral: "#d97c62",
      },
      boxShadow: {
        album: "0 30px 80px rgba(62, 36, 36, 0.14)",
      },
      backgroundImage: {
        grain:
          "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.7), transparent 22%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.35), transparent 18%), radial-gradient(circle at 50% 80%, rgba(217,124,98,0.08), transparent 26%)",
      },
      fontFamily: {
        serif: [
          "var(--font-serif)",
          "Iowan Old Style",
          "Palatino Linotype",
          "Book Antiqua",
          "Georgia",
          "serif",
        ],
        sans: [
          "var(--font-sans)",
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
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "sans-serif",
        ],
      },
      keyframes: {
        rise: {
          "0%": {
            opacity: "0",
            transform: "translateY(18px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        rise: "rise 650ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;

