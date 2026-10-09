import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  clearScreen: false,
  base: "./",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
