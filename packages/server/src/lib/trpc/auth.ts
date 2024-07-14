import bcryptjs from "bcryptjs";
import { usersTable } from "@mainframe-api/shared";
import { eq } from "drizzle-orm";
import { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import { env } from "../env.server.ts";

const { hash } = bcryptjs;

export async function createUserAccount(
  db: SqliteRemoteDatabase,
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
  db: SqliteRemoteDatabase,
  username: string,
  password: string,
): Promise<{ id: string } | null> {
  if (!env.VITE_AUTH_PASS) {
    return null;
  }
  const [user] = await db
    .select({ id: usersTable.id, password: usersTable.password })
    .from(usersTable)
    .where(eq(usersTable.username, username));
  return user && user.password === (await hash(password, user.password))
    ? { id: user.id }
    : null;
}
