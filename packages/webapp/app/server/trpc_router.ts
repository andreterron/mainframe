import { TRPCError, initTRPC } from "@trpc/server";
import { datasetsTable } from "../db/schema";
import { db } from "../db/db.server";
import { z } from "zod";
import { Context } from "./trpc_context";
import { zDatasetInsert, zDatasetPatch } from "../db/validation";
import { eq } from "drizzle-orm";
import { syncDataset } from "../../server/sync";
import { getSession } from "../sessions.server";

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
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
