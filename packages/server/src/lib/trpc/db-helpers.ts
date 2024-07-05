import { LibSQLDatabase } from "drizzle-orm/libsql";
import { usersTable } from "@mainframe-so/shared";
import { env } from "../env.server.ts";

export async function checkIfUserExists(db: LibSQLDatabase) {
  if (!env.VITE_AUTH_PASS) {
    return false;
  }
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .limit(1);
  return !!user;
}
