import { migrate } from "drizzle-orm/libsql/migrator";
import { LibSQLDatabase, drizzle } from "drizzle-orm/libsql";
import { Client } from "@libsql/client";
import { resolve } from "node:path";
import { src__dirnameFromImportMetaUrl } from "../utils/dirname.ts";
import journal from "./migrations/meta/_journal.json";

const __dirname = src__dirnameFromImportMetaUrl(import.meta.url);

export function migrateDB(
  db: LibSQLDatabase,
  folder: string = resolve(__dirname, "migrations"),
) {
  return migrate(db, { migrationsFolder: folder });
}

export function migrateClient(client: Client) {
  return migrateDB(drizzle(client));
}

export const dbVersion = journal.entries.reduce(
  (max, entry) => Math.max(max, entry.idx),
  0,
);
