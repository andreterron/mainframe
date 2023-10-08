import { Dataset } from "./types";
import { Request, Response } from "express";

export interface IntegrationTable {
    name: string;
    get?: (dataset: Dataset) => Promise<any>;
    rowId?: (dataset: Dataset, row: any) => string;
}

export interface IntegrationObject {
    name: string;
    get?: (dataset: Dataset) => Promise<any>;
    objId?: (dataset: Dataset, obj: any) => string;
}

// TODO: Merge `objects` and `tables` options
export interface Integration {
    name: string;
    setupWebhooks?: (dataset: Dataset, baseApiUrl: string) => Promise<any>;
    webhook?: (
        dataset: Dataset,
        // TODO: Migrate away from express
        req: Request,
        res: Response,
    ) => Promise<any>;
    objects?: {
        [key: string]: IntegrationObject;
    };
    tables: {
        [key: string]: IntegrationTable;
    };
}
