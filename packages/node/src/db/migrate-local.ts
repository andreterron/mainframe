import { dbClient } from "./db.server.ts";
import { migrateDB } from "@mainframe-so/server";
import { drizzle } from "drizzle-orm/libsql/driver";

migrateDB(drizzle(dbClient));
