import { type SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import { type OperationsEmitter } from "./lib/operations";

export type Env = {
  Variables: {
    db?: SqliteRemoteDatabase;
    operations?: OperationsEmitter;
  };
};
