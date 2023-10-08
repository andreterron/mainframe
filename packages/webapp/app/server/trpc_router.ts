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
import { getSession } from "../sessions.server";
import { getDatasetObject, getDatasetTable } from "../lib/integrations";
import { deserializeData } from "../utils/serialization";
import { ROW_LIMIT } from "../utils/constants";

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

    const userId = session.get("userId");

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
