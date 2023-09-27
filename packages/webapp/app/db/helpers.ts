import { db } from "./db.server";
import { usersTable } from "./schema";

export async function checkIfUserExists() {
    const [user] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .limit(1);
    return !!user;
}
