import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { join, resolve } from "path";

const dbDirname = resolve(__dirname, "..", "..", "..", "..", "database");
const dbPath = join(dbDirname, "mainframe.db");

// Ensure that the database folder exists
try {
    mkdirSync(dbDirname);
} catch (e) {
    if (!(e instanceof Error) || !("code" in e) || e.code !== "EEXIST") {
        console.log(
            `Failed to create database dir, please create it manually: ${dbDirname}`,
        );
        throw e;
    }
}

const sqlite = new Database(dbPath);

export const db: BetterSQLite3Database = drizzle(sqlite);
