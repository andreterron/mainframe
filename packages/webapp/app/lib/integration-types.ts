import { Dataset } from "./types";

export interface IntegrationTable {
    name: string;
    get?: (dataset: Dataset & { _id: string }) => Promise<any>;
    rowId?: (dataset: Dataset & { _id: string }, row: any) => string;
}

export interface IntegrationObject {
    name: string;
    get?: (dataset: Dataset) => Promise<any>;
    objId?: (dataset: Dataset & { _id: string }, obj: any) => string;
}

// TODO: Merge `objects` and `tables` options
export interface Integration {
    name: string;
    objects?: {
        [key: string]: IntegrationObject;
    };
    tables: {
        [key: string]: IntegrationTable;
    };
}
