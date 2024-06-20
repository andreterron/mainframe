import { migrate } from "drizzle-orm/libsql/migrator";
import { LibSQLDatabase, drizzle } from "drizzle-orm/libsql";
import { Client } from "@libsql/client";
import { resolve } from "node:path";
import { __dirnameFromImportMetaUrl } from "../utils/dirname";
import journal from "./migrations/meta/_journal.json";

const __dirname = __dirnameFromImportMetaUrl(import.meta.url);

export function migrateDB(db: LibSQLDatabase) {
  return migrate(db, { migrationsFolder: resolve(__dirname, "migrations") });
}

export function migrateClient(client: Client) {
  return migrateDB(drizzle(client));
}

export const dbVersion = journal.entries.reduce(
  (max, entry) => Math.max(max, entry.idx),
  0,
);
