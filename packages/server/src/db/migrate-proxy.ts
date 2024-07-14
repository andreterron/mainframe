import { migrate } from "drizzle-orm/sqlite-proxy/migrator";
import { migrationsFolder } from "./migrate";
import { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import { sql } from "drizzle-orm";

export function migrateProxySQLiteDB(db: SqliteRemoteDatabase) {
  return migrate(
    db,
    async (queries) => {
      for (let q of queries) {
        await db.run(sql.raw(q));
      }
    },
    { migrationsFolder: migrationsFolder },
  );
}
