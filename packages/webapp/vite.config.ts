import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { config } from "dotenv";

// TODO: Review .env file location
config({ path: "../../.env" });

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8744,
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
