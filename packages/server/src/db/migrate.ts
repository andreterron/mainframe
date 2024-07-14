import { resolve } from "node:path";
import { src__dirnameFromImportMetaUrl } from "../utils/dirname.ts";
import journal from "./migrations/meta/_journal.json";

const __dirname = src__dirnameFromImportMetaUrl(import.meta.url);

export const migrationsFolder = resolve(__dirname, "migrations");

export const dbVersion = journal.entries.reduce(
  (max, entry) => Math.max(max, entry.idx),
  0,
);
