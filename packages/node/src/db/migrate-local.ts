import { db } from "./db.server.ts";
import { migrateDB } from "./migrate.ts";
import { src__dirnameFromImportMetaUrl } from "../utils/dirname.ts";
import { resolve } from "path";

const __dirname = src__dirnameFromImportMetaUrl(import.meta.url);

migrateDB(db, resolve(__dirname, "migrations"));
