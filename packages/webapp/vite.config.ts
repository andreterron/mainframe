import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { config } from "dotenv";
import process from "node:process";

config({ path: process.env.DOTENV_CONFIG_PATH || "../../.env" });

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8744,
    proxy: {
      "/oauth": "http://localhost:8745/oauth",
    },
  },

  plugins: [
    react(),
    sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: "mainframe",
      project: "mainframe-client",
      disable: !!process.env.SENTRY_AUTH_TOKEN,
    }),
  ],

  resolve: {
    alias: {
      "~": resolve(__dirname, "./app"),
      app: resolve(__dirname, "./app"),
    },
  },

  build: {
    sourcemap: true,
  },
});
