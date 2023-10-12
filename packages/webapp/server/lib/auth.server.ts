import { hash } from "bcryptjs";
import { db } from "../db/db.server";
import { usersTable } from "../../app/db/schema";
import { eq } from "drizzle-orm";

export async function createUserAccount(username: string, password: string) {
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
