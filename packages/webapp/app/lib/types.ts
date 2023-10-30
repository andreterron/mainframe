import { InferSelectModel } from "drizzle-orm";
import type {
    datasetsTable,
    objectsTable,
    rowsTable,
    tablesTable,
} from "../db/schema";

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
}
