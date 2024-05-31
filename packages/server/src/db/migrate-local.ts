import { db } from "./db.server.js";
import { migrateDB } from "./migrate.js";

migrateDB(db);
