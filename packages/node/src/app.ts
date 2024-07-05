import { GLOBAL_operations } from "./lib/operations.ts";
import { dbClient } from "./db/db.server.ts";
import { setupServer } from "./server.ts";

setupServer({
  getRequestCtx: () => {
    return {
      db: dbClient,
      operations: GLOBAL_operations,
    };
  },
});
