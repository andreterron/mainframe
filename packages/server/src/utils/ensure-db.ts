import { type SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import { HTTPException } from "hono/http-exception";

export function ensureDB(
  db: SqliteRemoteDatabase | undefined,
): asserts db is SqliteRemoteDatabase {
  if (!db) {
    throw new HTTPException(500, {
      message:
        "Missing Hono variable `db`. Please ensure you return a Drizzle LibSQLite database on the `getRequestCtx` setting of `createMainframeAPI({})`.",
    });
  }
}
