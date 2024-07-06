import { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import { usersTable } from "@mainframe-so/shared";
import { env } from "../env.server.ts";

export async function checkIfUserExists(db: SqliteRemoteDatabase) {
  if (!env.VITE_AUTH_PASS) {
    return false;
  }
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .limit(1);
  return !!user;
}
