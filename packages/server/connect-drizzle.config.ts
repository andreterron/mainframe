import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import process from "node:process";

config({ path: process.env.DOTENV_CONFIG_PATH || "../../.env" });

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/connect-db/connect-schema.ts",
  out: "./src/db/connect-db/migrations",
  driver: "turso",
  dbCredentials: {
    url: process.env.CONNECT_DB_URL!,
    authToken: process.env.CONNECT_DB_TOKEN!,
  },
});
