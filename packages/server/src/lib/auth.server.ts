import { hash } from "bcryptjs";
import { usersTable } from "@mainframe-so/shared";
import { eq } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";

export async function createUserAccount(
  db: LibSQLDatabase,
  username: string,
  password: string,
) {
  const hashed = await hash(password, 10);
  const [inserted] = await db
    .insert(usersTable)
    .values({
      password: hashed,
      username: username,
    })
    .returning({ id: usersTable.id });
  return inserted;
}

export async function validateUserAccount(
  db: LibSQLDatabase,
  username: string,
  password: string,
): Promise<{ id: string } | null> {
  const [user] = await db
    .select({ id: usersTable.id, password: usersTable.password })
    .from(usersTable)
    .where(eq(usersTable.username, username));
  return user && user.password === (await hash(password, user.password))
    ? { id: user.id }
    : null;
}
