import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./db.server";
import { resolve } from "node:path";

migrate(db, { migrationsFolder: resolve(__dirname, "migrations") });
