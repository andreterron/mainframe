import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { migrationsFolder } from "./migrate";
import { Client } from "@libsql/client";

export function migrateLibsqlDB(db: LibSQLDatabase) {
  return migrate(db, { migrationsFolder });
}

export function migrateLibsqlDBClient(db: Client) {
  return migrateLibsqlDB(drizzle(db));
}
