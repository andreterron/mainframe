import { Dataset, AuthType, ComputedDataParamsDef } from "@mainframe-so/shared";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { Request, Response } from "express";

export interface IntegrationTable {
  name: string;
  get?: (dataset: Dataset, db: LibSQLDatabase) => Promise<any>;
  rowId?: (dataset: Dataset, row: any) => string;
}

export interface IntegrationObject {
  name: string;
  get?: (dataset: Dataset) => Promise<any>;
  objId?: (dataset: Dataset, obj: any) => string;
}

export interface IntegrationComputed {
  name: string;
  params: ComputedDataParamsDef;
  // TODO: Params type
  get?: (dataset: Dataset, params: any) => Promise<any>;
}

// TODO: Merge `objects` and `tables` options
export interface Integration {
  name: string;
  underReview?: boolean;
  authType?: AuthType;
  authTypes?: {
    nango?: {
      integrationId: string;
    };
  };
  authSetupDocs?: string;
  getOAuthUrl?: (
    baseUrl: string,
    dataset: Dataset,
  ) => Promise<string | null> | string | null;
  oauthCallback?: (
    baseUrl: string,
    dataset: Dataset,
    query: { code: string },
    db: LibSQLDatabase,
  ) => Promise<void>;
  setupWebhooks?: (
    db: LibSQLDatabase,
    dataset: Dataset,
    baseApiUrl: string,
  ) => Promise<any>;
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
  computed?: {
    [key: string]: IntegrationComputed;
  };
  actions?: {
    [key: string]: (dataset: Dataset, input: any) => Promise<any>;
  };
}
