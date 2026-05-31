import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  optimizeDeps: {
    exclude: ["cubing"],
  },
  worker: {
    format: "es",
  },
  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        format: "es",
      },
    },
  },
});
