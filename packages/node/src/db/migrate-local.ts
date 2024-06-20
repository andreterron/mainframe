import { db } from "./db.server";
import { migrateDB } from "./migrate";

migrateDB(db);
