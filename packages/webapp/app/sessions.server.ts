import {
    Cookie,
    CookieOptions,
    createCookie,
    createSessionStorage,
} from "@remix-run/node";
import { db } from "./db/db.server";
import { sessionsTable } from "./db/schema";
import { eq } from "drizzle-orm";
import { env } from "./lib/env.server";
import { z } from "zod";

export const zSessionData = z.object({
    userId: z.string().optional(),
    error: z.enum(["not_found"]).optional(),
});

export type MainframeSessionData = z.infer<typeof zSessionData>;

function createDatabaseSessionStorage({
    cookie,
}: {
    cookie:
        | Cookie
        | (CookieOptions & {
              name?: string;
          });
}) {
    return createSessionStorage<MainframeSessionData>({
        cookie,
        async createData(data, expires) {
            // `expires` is a Date after which the data should be considered
            // invalid. You could use it to invalidate the data somehow or
            // automatically purge this record from your database.
            const { nanoid } = await import("nanoid");
            const id = nanoid(32);
            await db.insert(sessionsTable).values({
                id,
                userId: data.userId ?? null,
                expires: expires?.getTime() ?? null,
            });
            return id;
        },
        async readData(id) {
            const [row] = await db
                .select({ userId: sessionsTable.userId })
                .from(sessionsTable)
                .where(eq(sessionsTable.id, id));

            if (!row) return { error: "not_found" };

            return {
                userId: row.userId ?? undefined,
            };
        },
        async updateData(id, data, expires) {
            await db
                .update(sessionsTable)
                .set({
                    userId: data.userId ?? null,
                    expires: expires?.getTime() ?? null,
                })
                .where(eq(sessionsTable.id, id));
        },
        async deleteData(id) {
            await db.delete(sessionsTable).where(eq(sessionsTable.id, id));
        },
    });
}

export const sessionCooke = createCookie("__session", {
    httpOnly: true,
    // maxAge: 400 days is to the maximum timespan available
    // https://developer.chrome.com/blog/cookie-max-age-expires/
    maxAge: 400 * 24 * 60 * 60,
    secrets: [env.COOKIE_SECRET],
    secure: true,
});

const { getSession, commitSession, destroySession } =
    createDatabaseSessionStorage({
        // a Cookie from `createCookie` or the CookieOptions to create one
        cookie: sessionCooke,
    });

export { getSession, commitSession, destroySession };
