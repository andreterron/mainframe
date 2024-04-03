import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { config } from "dotenv";

config({ path: "../../.env" });

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8744,
  },

  plugins: [react(), sentryVitePlugin({
    org: "mainframe",
    project: "mainframe-client"
  })],

  resolve: {
    alias: {
      "~": resolve(__dirname, "./app"),
      app: resolve(__dirname, "./app"),
    },
  },

  build: {
    sourcemap: true
  }
});