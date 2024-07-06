import { createClient } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { __dirnameFromImportMetaUrl } from "@mainframe-so/server";

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

export const dbClient = createClient({ url: `file://${dbPath}` });
