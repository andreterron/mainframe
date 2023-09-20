import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { join } from "path";

// TODO: Improve how this path is obtained
//       We're using replace because remix runs this from the build folder
const dbDirname = __dirname.replace(
    /([\/\\])packages[\/\\]webapp[\/\\].*/,
    "$1database",
);
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
