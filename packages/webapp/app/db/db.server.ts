import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

// TODO: Improve how this path is obtained
const dbPath = __dirname.replace(
    /\/packages\/webapp\/.*/,
    "/packages/webapp/app/db/mainframe.db",
);

const sqlite = new Database(dbPath);

export const db: BetterSQLite3Database = drizzle(sqlite);
