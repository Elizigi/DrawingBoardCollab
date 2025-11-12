import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; 
import path from "node:path";

export default defineConfig({
   base: "./",
  plugins: [react()],
  server: {
    port: 8080,
    open: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/colors.scss" as *;`
      },
    },
  },
});
