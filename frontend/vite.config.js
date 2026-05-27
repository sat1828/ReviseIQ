import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // All /api/* requests are forwarded to the Express backend.
      // The browser sees a same-origin request — zero CORS errors.
      "/api": {
        target:       process.env.VITE_API_URL || "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  test: {
    globals:     true,
    environment: "jsdom",
    setupFiles:  ["./src/setupTests.js"],
  },
});
