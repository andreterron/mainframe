import { TRPCError, initTRPC } from "@trpc/server";
import {
    datasetsTable,
    objectsTable,
    rowsTable,
    tablesTable,
} from "../db/schema";
import { db } from "../db/db.server";
import { z } from "zod";
import { Context } from "./trpc_context";
import { zDatasetInsert, zDatasetPatch } from "../db/validation";
import { and, eq } from "drizzle-orm";
import { syncDataset, syncObject, syncTable } from "../../server/sync";
import { commitSession, destroySession, getSession } from "../sessions.server";
import { getDatasetObject, getDatasetTable } from "../lib/integrations";
import { deserializeData } from "../utils/serialization";
import { ROW_LIMIT } from "../utils/constants";
import { createUserAccount, validateUserAccount } from "../lib/auth.server";
import { checkIfUserExists } from "../db/helpers";

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create();

const router = t.router;
// const publicProcedure = t.procedure;

const isAuthed = t.middleware(async (opts) => {
    const { ctx } = opts;

    const session = await getSession(ctx.req.headers.get("cookie"));

    const userId = session.data.userId;

    if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return opts.next({
        ctx,
    });
});

export const protectedProcedure = t.procedure.use(isAuthed);

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const appRouter = router({
    // Auth
    authInfo: t.procedure.query(async ({ input, ctx }) => {
        console.log("TRPC AUTH INFO");
        const hasUsers = await checkIfUserExists();

        const session = await getSession(ctx.req.headers.get("Cookie"));
        const userId = session.data.userId;
        console.log("TRPC AUTH INFO DATA", userId);

        return {
            hasUsers,
            isLoggedIn: !!userId,
        };
    }),
    login: t.procedure
        .input(
            z.object({
                username: z.string().nonempty(),
                password: z.string().nonempty(),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            const { username, password } = input;

            const account = await validateUserAccount(username, password);

            if (!account) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Invalid username/password",
                });
            }

            // Don't pass the cookie header here, because we always want a fresh session
            const session = await getSession();

            session.data.userId = account.id;

            ctx.resHeaders.append("Set-Cookie", await commitSession(session));

            console.log("TRPC ALMOST DONE LOGIN");
            return {
                redirect: "/",
            };
        }),
    signup: t.procedure
        .input(
            z.object({
                username: z.string().nonempty(),
                password: z.string().nonempty(),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            const hasUsers = await checkIfUserExists();

            if (hasUsers) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Only one user can be created, please login",
                });
            }

            const { username, password } = input;

            // TODO: This can fail if the username already exists
            const account = await createUserAccount(username, password);

            // Don't pass the cookie header here, because we always want a fresh session
            const session = await getSession();

            session.data.userId = account.id;

            ctx.resHeaders.append("Set-Cookie", await commitSession(session));

            return {
                redirect: "/",
            };
        }),
    logout: t.procedure.mutation(async ({ ctx }) => {
        const session = await getSession(ctx.req.headers.get("Cookie"));

        const hasUsers = await checkIfUserExists();

        ctx.resHeaders.append("Set-Cookie", await destroySession(session));

        return {
            redirect: hasUsers ? "/login" : "/setup",
        };
    }),

    // Dataset
    datasetsAll: protectedProcedure.query(async () => {
        const datasets = await db.select().from(datasetsTable);
        return datasets;
    }),
    datasetsGet: protectedProcedure
        .input(z.object({ id: z.string().nonempty() }))
        .query(async ({ input }) => {
            const [dataset] = await db
                .select()
                .from(datasetsTable)
                .where(eq(datasetsTable.id, input.id))
                .limit(1);

            if (!dataset) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            return dataset;
        }),
    datasetsCreate: protectedProcedure
        .input(zDatasetInsert)
        .mutation(async ({ input }) => {
            const [dataset] = await db
                .insert(datasetsTable)
                .values(input)
                .returning();

            if (!dataset) {
                throw new TRPCError({ code: "CONFLICT" });
            }

            void syncDataset(dataset).catch((e) => console.error(e));

            return dataset;
        }),
    datasetsUpdate: protectedProcedure
        .input(z.object({ id: z.string(), patch: zDatasetPatch }))
        .mutation(async ({ input }) => {
            const [dataset] = await db
                .update(datasetsTable)
                .set(input.patch)
                .where(eq(datasetsTable.id, input.id))
                .returning();

            if (!dataset) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            void syncDataset(dataset).catch((e) => console.error(e));

            return dataset;
        }),
    datasetsDelete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            await db
                .delete(datasetsTable)
                .where(eq(datasetsTable.id, input.id));
        }),

    // Object

    getObjectAndDataset: protectedProcedure
        .input(
            z.object({
                datasetId: z.string().optional(),
                objectId: z.string().optional(),
            }),
        )
        .query(async ({ input }) => {
            const { datasetId, objectId } = input;

            if (!datasetId || !objectId) {
                // TODO: Review
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            let [[dataset], [object]] = await Promise.all([
                db
                    .select()
                    .from(datasetsTable)
                    .where(eq(datasetsTable.id, datasetId))
                    .limit(1),
                db
                    .select()
                    .from(objectsTable)
                    .where(
                        and(
                            eq(objectsTable.objectType, objectId),
                            eq(objectsTable.datasetId, datasetId),
                        ),
                    )
                    .limit(1),
            ]);

            const objectDefinition = getDatasetObject(dataset, objectId);

            const syncPromise = objectDefinition
                ? syncObject(dataset, objectDefinition)
                : null;

            if (!object) {
                await syncPromise;

                [object] = await db
                    .select()
                    .from(objectsTable)
                    .where(
                        and(
                            eq(objectsTable.objectType, objectId),
                            eq(objectsTable.datasetId, datasetId),
                        ),
                    )
                    .limit(1);
            }

            if (!object) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            return {
                object: deserializeData(object),
                dataset,
            };
        }),

    // Table
    tablesPageLoader: protectedProcedure
        .input(
            z.object({
                datasetId: z.string().optional(),
                tableId: z.string().optional(),
            }),
        )
        .query(async ({ input }) => {
            const { datasetId, tableId } = input;
            if (!datasetId || !tableId) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            const [dataset] = await db
                .select()
                .from(datasetsTable)
                .where(eq(datasetsTable.id, datasetId))
                .limit(1);

            if (!dataset) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            const table = getDatasetTable(dataset, tableId);

            if (!table) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            // Upsert table
            const tableRows = await db
                .insert(tablesTable)
                .values({
                    datasetId: dataset.id,
                    name: table.name,
                    key: tableId,
                })
                .onConflictDoUpdate({
                    target: [tablesTable.datasetId, tablesTable.key],
                    set: { key: tableId },
                })
                .returning({ view: tablesTable.view });

            const rows = await db
                .select({ id: rowsTable.id, data: rowsTable.data })
                .from(rowsTable)
                .innerJoin(tablesTable, eq(tablesTable.id, rowsTable.tableId))
                .where(
                    and(
                        eq(tablesTable.datasetId, datasetId),
                        eq(tablesTable.key, tableId),
                    ),
                )
                .limit(ROW_LIMIT);

            // Trigger sync of this table in the background
            void syncTable(dataset, table).catch((e) => console.error(e));

            return {
                dataset,
                rows: rows.map(deserializeData),
                table: tableRows.at(0),
            };
        }),
    tablesUpdateView: protectedProcedure
        .input(
            z.object({
                datasetId: z.string().nonempty(),
                tableId: z.string().nonempty(),
                // TODO: Make sure view is what we expect before saving
                view: z.string().nonempty(),
            }),
        )
        .mutation(async ({ input }) => {
            const { datasetId, tableId, view } = input;

            const returned = await db
                .update(tablesTable)
                .set({ view: view })
                .where(
                    and(
                        eq(tablesTable.datasetId, datasetId),
                        eq(tablesTable.key, tableId),
                    ),
                )
                .returning();

            if (returned.length === 0) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }
        }),

    // Row
    getRow: protectedProcedure
        .input(
            z.object({
                rowId: z.string().optional(),
            }),
        )
        .query(async ({ input: { rowId } }) => {
            if (!rowId) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }
            const [row] = await db
                .select({ data: rowsTable.data })
                .from(rowsTable)
                .where(eq(rowsTable.id, rowId))
                .limit(1);
            if (!row) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }
            return deserializeData(row);
        }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
