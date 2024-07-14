import { GLOBAL_operations } from "./lib/operations.ts";
import { dbClient } from "./db/db.server.ts";
import { setupServer } from "./server.ts";
import { drizzle } from "drizzle-orm/libsql/driver";
import {
  getSessionFromId,
  getSessionIdFromCookieHeader,
  parseBearerHeader,
} from "@mainframe-api/server";

const GLOBAL_db = drizzle(dbClient);

setupServer({
  getRequestCtx: async (c) => {
    const authorization = c.req.header("authorization");

    const bearer = parseBearerHeader(authorization);
    const sessionId =
      bearer ?? getSessionIdFromCookieHeader(c.req.header("cookie"));

    const session = sessionId
      ? await getSessionFromId(GLOBAL_db, sessionId)
      : undefined;

    return {
      db: GLOBAL_db,
      operations: GLOBAL_operations,
      userId: session?.data.userId,
    };
  },
});
