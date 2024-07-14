import {
  Dataset,
  AuthType,
  ComputedDataParamsDef,
} from "@mainframe-api/shared";
import { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import { MainframeContext } from "./context";

export interface IntegrationTable {
  name: string;
  get?: (dataset: Dataset, db: SqliteRemoteDatabase) => Promise<any>;
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
    form?: {
      params: {
        key: string;
        label?: string;
        placeholder?: string;
        type?: "text" | "password";
      }[];
      info?: string;
      onSubmit(
        dataset: Dataset,
        params: Record<string, string>,
        db: SqliteRemoteDatabase<Record<string, never>>,
      ): Promise<void>;
    };
  };
  proxyFetch?: (
    token: string,
    path: string,
    init?: RequestInit,
  ) => Promise<Response>;
  authSetupDocs?: string;
  getOAuthUrl?: (
    baseUrl: string,
    dataset: Dataset,
  ) => Promise<string | null> | string | null;
  oauthCallback?: (
    baseUrl: string,
    dataset: Dataset,
    query: { code: string },
    db: SqliteRemoteDatabase,
  ) => Promise<void>;
  setupWebhooks?: (
    ctx: MainframeContext,
    dataset: Dataset,
    baseApiUrl: string,
  ) => Promise<any>;
  webhook?: (
    ctx: MainframeContext,
    dataset: Dataset,
    req: Request,
  ) => Promise<Response>;
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
