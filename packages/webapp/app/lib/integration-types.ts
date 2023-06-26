import { Dataset } from "./types";

export interface IntegrationTable {
    name: string;
    get?: (dataset: Dataset) => Promise<any>;
    rowId?: (dataset: Dataset & { _id: string }, row: any) => string;
}

export interface Integration {
    tables: {
        [key: string]: IntegrationTable;
    };
}
