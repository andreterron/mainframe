import { LibSQLDatabase } from "drizzle-orm/libsql";
import { usersTable } from "@mainframe-so/shared";

export async function checkIfUserExists(db: LibSQLDatabase) {
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .limit(1);
  return !!user;
}
