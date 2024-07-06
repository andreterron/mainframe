import { GLOBAL_operations } from "./lib/operations.ts";
import { dbClient } from "./db/db.server.ts";
import { setupServer } from "./server.ts";
import { drizzle } from "drizzle-orm/libsql/driver";

const GLOBAL_db = drizzle(dbClient);

setupServer({
  getRequestCtx: () => {
    return {
      db: GLOBAL_db,
      operations: GLOBAL_operations,
    };
  },
});
