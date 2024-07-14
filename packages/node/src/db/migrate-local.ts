import { dbClient } from "./db.server.ts";
import { migrateLibsqlDBClient } from "@mainframe-api/server";

migrateLibsqlDBClient(dbClient);
