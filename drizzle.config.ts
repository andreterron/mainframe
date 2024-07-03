import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  out: "./packages/server/src/db/migrations",
  schema: "./packages/shared/src/db/schema.ts",
});
