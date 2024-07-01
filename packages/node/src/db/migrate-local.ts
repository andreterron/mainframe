import { dbClient } from "./db.server.ts";
import { migrateDB } from "./migrate.ts";
import { src__dirnameFromImportMetaUrl } from "../utils/dirname.ts";
import { resolve } from "path";
import { drizzle } from "drizzle-orm/libsql/driver";

const __dirname = src__dirnameFromImportMetaUrl(import.meta.url);

migrateDB(drizzle(dbClient), resolve(__dirname, "migrations"));
