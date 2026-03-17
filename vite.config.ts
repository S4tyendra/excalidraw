import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production"),
  },
  build: {
    outDir: "dist",
  },
});
