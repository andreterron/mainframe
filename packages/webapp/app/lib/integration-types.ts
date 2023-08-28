import { Dataset } from "./types";
import { Request, Response } from "express";

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
    setup?: (dataset: Dataset & { _id: string }) => Promise<any>;
    webhook?: (
        dataset: Dataset & { _id: string },
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
