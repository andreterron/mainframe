import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8744,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "~": resolve(__dirname, "./app"),
      app: resolve(__dirname, "./app"),
    },
  },
});
