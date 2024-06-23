import { LibSQLDatabase } from "drizzle-orm/libsql";
import { HTTPException } from "hono/http-exception";

export function ensureDB(
  db: LibSQLDatabase | undefined,
): asserts db is LibSQLDatabase {
  if (!db) {
    throw new HTTPException(500, {
      message:
        "Missing Hono variable `db`. Please ensure you return a Drizzle LibSQLite database on the `getRequestDB` setting of `createMainframeAPI({})`.",
    });
  }
}
