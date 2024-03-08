import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { usersTable } from "@mainframe-so/shared";

export async function checkIfUserExists(db: BetterSQLite3Database) {
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .limit(1);
  return !!user;
}
