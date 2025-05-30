import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { config } from "dotenv";
import process from "node:process";
import { nodePolyfills } from "vite-plugin-node-polyfills";

config({ path: process.env.DOTENV_CONFIG_PATH || "../../.env" });

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8744,
    host: parseHost(process.env.MAINFRAME_HOST),
  },

  plugins: [
    react(),
    sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: "mainframe",
      project: "mainframe-client",
      disable: !!process.env.SENTRY_AUTH_TOKEN,
    }),
    nodePolyfills({
      // Specify what to polyfill (e.g., process, Buffer, etc.)
      protocolImports: true,
    }),
  ],

  resolve: {
    alias: {
      "~": resolve(__dirname, "./app"),
      app: resolve(__dirname, "./app"),
      // Use a fallback for process
      process: "process/browser",
    },
  },

  build: {
    sourcemap: true,
  },
});

function parseHost(input: string | undefined): boolean | string | undefined {
  switch (input) {
    case "true":
      return true;
    case "false":
      return false;
    case undefined:
      return undefined;
    default:
      return input;
  }
}
