import { db } from "./db.server.ts";
import { migrateDB } from "./migrate.ts";

migrateDB(db);
