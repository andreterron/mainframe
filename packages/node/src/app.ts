import { GLOBAL_operations } from "@mainframe-so/server";
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
