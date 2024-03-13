import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { mkdirSync } from "fs";
import { join, resolve } from "path";
import { __dirnameFromImportMetaUrl } from "../utils/dirname";

const __dirname = __dirnameFromImportMetaUrl(import.meta.url);

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

const sqlite = createClient({ url: `file://${dbPath}` });

export const db: LibSQLDatabase = drizzle(sqlite);
