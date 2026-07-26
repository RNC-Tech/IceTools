/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Satoshi", "ui-sans-serif", "system-ui", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        // rnc.labs light - the brand's primary mode: 70% secondary off-white
        // background, 20% primary teal for structural elements, 8% brand
        // black reserved for type/nav, 2% sage/clay accents used sparingly.
        rnclabs: {
          primary: "#19444B",
          "primary-content": "#ECEBE6",
          secondary: "#7FA3A0",
          "secondary-content": "#0F1E20",
          accent: "#C48A6A",
          "accent-content": "#0F1E20",
          neutral: "#4B5F63",
          "neutral-content": "#ECEBE6",
          "base-100": "#ECEBE6",
          "base-200": "#E3E2DC",
          "base-300": "#D6D5D0",
          "base-content": "#0F1E20",
          info: "#5C8AA0",
          "info-content": "#0F1E20",
          success: "#7FA3A0",
          "success-content": "#0F1E20",
          warning: "#C48A6A",
          "warning-content": "#0F1E20",
          error: "#B5533C",
          "error-content": "#ECEBE6",
          "--rounded-box": "0.75rem",
          "--rounded-btn": "0.5rem",
          default: true,
        },
      },
      {
        // rnc.labs dark - same palette, inverted emphasis: brand black
        // becomes the base surface, teal steps in as the deeper surface tier,
        // sage/clay brighten into the primary/secondary accents so they read
        // clearly against a dark background.
        rnclabsdark: {
          primary: "#7FA3A0",
          "primary-content": "#0F1E20",
          secondary: "#C48A6A",
          "secondary-content": "#0F1E20",
          accent: "#8CA5AA",
          "accent-content": "#0F1E20",
          neutral: "#4B5F63",
          "neutral-content": "#ECEBE6",
          "base-100": "#0F1E20",
          "base-200": "#16292C",
          "base-300": "#19444B",
          "base-content": "#ECEBE6",
          info: "#6FA0B8",
          "info-content": "#0F1E20",
          success: "#7FA3A0",
          "success-content": "#0F1E20",
          warning: "#C48A6A",
          "warning-content": "#0F1E20",
          error: "#D9755A",
          "error-content": "#0F1E20",
          "--rounded-box": "0.75rem",
          "--rounded-btn": "0.5rem",
          prefersdark: true,
        },
      },
    ],
  },
};
