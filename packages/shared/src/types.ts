import type { InferSelectModel } from "drizzle-orm";
import type {
  datasetsTable,
  objectsTable,
  rowsTable,
  tablesTable,
} from "./db/schema.ts";
import { z } from "zod";

export type Dataset = InferSelectModel<typeof datasetsTable>;

export type Table = InferSelectModel<typeof tablesTable>;

export type Row = InferSelectModel<typeof rowsTable>;

export type DatasetObject = InferSelectModel<typeof objectsTable>;

export type DBTypes = Dataset | Row | DatasetObject;

export interface DatasetCredentials {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  nangoIntegrationId?: string;
  nangoConnectionId?: string;
}

// Operations

export const zRowOperation = z.object({
  type: z.literal("row"),
  tableId: z.string(),
  data: z.any(),
});

export const zObjectOperation = z.object({
  type: z.literal("object"),
  datasetId: z.string(),
  objectType: z.string(),
  data: z.any(),
});

export const zTableOperation = z.object({
  type: z.literal("table"),
  datasetId: z.string(),
  tableId: z.string(),
});

export type Operation =
  | z.infer<typeof zRowOperation>
  | z.infer<typeof zObjectOperation>
  | z.infer<typeof zTableOperation>
  | { type: "ping" };
