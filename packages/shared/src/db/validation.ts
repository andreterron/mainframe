import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { datasetsTable } from "./schema.js";

export const zDataset = createSelectSchema(datasetsTable);
export const zDatasetInsert = createInsertSchema(datasetsTable);
export const zDatasetPatch = zDatasetInsert.omit({ id: true });
