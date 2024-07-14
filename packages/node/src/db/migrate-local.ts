import { dbClient } from "./db.server.ts";
import { migrateLibsqlDBClient } from "@mainframe-so/server";

migrateLibsqlDBClient(dbClient);
