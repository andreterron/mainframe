import { Dataset } from "./types";

export interface IntegrationTable {
    name: string;
    get?: (dataset: Dataset) => Promise<any>;
}

export interface Integration {
    tables: {
        [key: string]: IntegrationTable;
    };
}
