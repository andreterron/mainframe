import { migrate } from "drizzle-orm/sqlite-proxy/migrator";
import { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import { resolve } from "node:path";
import { src__dirnameFromImportMetaUrl } from "../utils/dirname.ts";
import journal from "./migrations/meta/_journal.json";
import { sql } from "drizzle-orm";

const __dirname = src__dirnameFromImportMetaUrl(import.meta.url);

export function migrateDB(
  db: SqliteRemoteDatabase,
  folder: string = resolve(__dirname, "migrations"),
) {
  return migrate(
    db,
    async (queries) => {
      for (let q of queries) {
        await db.run(sql.raw(q));
      }
    },
    { migrationsFolder: folder },
  );
}

export const dbVersion = journal.entries.reduce(
  (max, entry) => Math.max(max, entry.idx),
  0,
);
